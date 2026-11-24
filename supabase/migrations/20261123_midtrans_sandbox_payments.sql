-- ============================================================================
-- MIDTRANS SANDBOX: pembayaran sewa booth (tenant) & pesanan pengunjung
--
-- Cara pakai: Supabase Dashboard > SQL Editor > New query, tempel seluruh file
-- ini, lalu Run. File ini TIDAK menghapus tabel atau data (tidak seperti
-- supabase/schema.sql). Aman dijalankan ulang.
--
-- Jika suatu saat supabase/schema.sql dijalankan ulang (menghapus semua tabel),
-- jalankan file ini lagi sesudahnya.
--
-- Yang berubah:
--   1. Tabel baru `payments` + `payment_events`. Hanya bisa diakses server
--      (service role); tidak ada policy untuk anon/authenticated.
--   2. `bookings`: status baru 'pending' (booth ditahan sampai dibayar),
--      kolom payment diperluas, plus payment_id & reserved_until.
--   3. `booths.reserved_until`: penahanan sementara supaya dua tenant tidak
--      bisa mengambil booth yang sama.
--   4. `visitor_orders`: payment_status dipisah dari status dapur (`status`).
--   5. Fungsi transaksi baru yang hanya bisa dipanggil server.
--   6. Fungsi lama book_booths() dan place_visitor_order() tidak lagi bisa
--      dipanggil dari browser, karena keduanya membuat booking/pesanan tanpa
--      pembayaran.
--
-- Data lama: booking dan pesanan yang dibuat sebelum integrasi ini tidak punya
-- bukti pembayaran, jadi diberi status pembayaran 'unpaid' (bukan 'paid').
-- ============================================================================


-- ============================================================================
-- 1. TABEL PEMBAYARAN (satu baris = satu transaksi Midtrans / satu order_id)
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  -- order_id yang dikirim ke Midtrans (maks. 50 karakter)
  order_id text not null unique check (char_length(order_id) between 1 and 50),
  kind text not null check (kind in ('booking', 'visitor_order')),
  -- booking: tenant penyewa; visitor_order: tenant pemilik booth penerima pesanan
  tenant_id uuid references public.profiles (id) on delete set null,
  event_id text references public.events (id) on delete set null,
  -- Nominal dalam rupiah penuh, dihitung database. Inilah yang dikirim sebagai gross_amount.
  amount bigint not null check (amount > 0),
  -- Rincian item untuk item_details Snap (jumlah price * quantity = amount)
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  midtrans_status text,
  fraud_status text,
  payment_type text,
  transaction_id text,
  snap_token text,
  -- Snap kedaluwarsa pada snap_expires_at; penahanan booth baru dilepas sesudah expires_at
  -- (selisih 2 menit) supaya pembayaran yang masih berjalan tidak kehilangan booth-nya.
  snap_expires_at timestamptz not null,
  expires_at timestamptz not null,
  -- Rahasia untuk pengunjung tamu (tanpa akun) membaca status pembayarannya
  access_token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  -- true bila uang masuk tetapi booth sudah dilepas/diambil tenant lain: perlu refund manual
  needs_review boolean not null default false,
  review_note text,
  paid_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_status_expiry_idx on public.payments (status, expires_at);
create index if not exists payments_tenant_idx on public.payments (tenant_id);

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

-- Catatan setiap notifikasi Midtrans yang diterima (audit + deduplikasi)
create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  payment_id uuid not null references public.payments (id) on delete cascade,
  event_key text not null unique,
  midtrans_status text,
  fraud_status text,
  status_code text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
create index if not exists payment_events_payment_idx on public.payment_events (payment_id);

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
grant select, insert, update on public.payments to service_role;
grant select, insert, update on public.payment_events to service_role;


-- ============================================================================
-- 2. BOOKING SEWA BOOTH: status 'pending' + status pembayaran
-- ============================================================================
-- Hapus check lama pada kolom status & payment (apa pun namanya), lalu pasang yang baru
do $$
declare
  old_check record;
begin
  for old_check in
    select c.conname
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
     where c.conrelid = 'public.bookings'::regclass
       and c.contype = 'c'
       and a.attname in ('status', 'payment')
  loop
    execute format('alter table public.bookings drop constraint %I', old_check.conname);
  end loop;
end
$$;

alter table public.bookings
  add column if not exists payment_id uuid references public.payments (id) on delete set null,
  add column if not exists reserved_until timestamptz;

alter table public.bookings
  add constraint bookings_status_check check (status in ('pending', 'confirmed', 'cancelled'));
alter table public.bookings
  add constraint bookings_payment_check
  check (payment in ('unpaid', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'));
alter table public.bookings alter column payment set default 'unpaid';

-- Booking lama tidak punya bukti pembayaran dari Midtrans
update public.bookings set payment = 'unpaid' where payment = 'paid' and payment_id is null;

-- Satu booth hanya boleh punya satu booking aktif (menunggu pembayaran ATAU sudah dikonfirmasi)
drop index if exists public.bookings_one_tenant_per_booth;
create unique index if not exists bookings_one_active_booking_per_booth
  on public.bookings (event_id, booth_label)
  where status in ('pending', 'confirmed');
create index if not exists bookings_payment_idx on public.bookings (payment_id);


-- ============================================================================
-- 3. BOOTH: penahanan sementara selama pembayaran berjalan
--    is_booked tetap berarti "sudah dibayar dan dikonfirmasi".
-- ============================================================================
alter table public.booths add column if not exists reserved_until timestamptz;

create or replace function public.booths_block_delete_when_reserved()
returns trigger
language plpgsql
as $$
begin
  if old.reserved_until is not null and old.reserved_until > now() and not old.is_booked then
    raise exception 'Booth % sedang dalam proses pembayaran tenant dan tidak bisa dihapus.', old.label;
  end if;
  return old;
end;
$$;

drop trigger if exists booths_no_delete_reserved on public.booths;
create trigger booths_no_delete_reserved before delete on public.booths
  for each row execute function public.booths_block_delete_when_reserved();


-- ============================================================================
-- 4. PESANAN PENGUNJUNG: status pembayaran terpisah dari status dapur
--    visitor_orders.status         = status dapur (pending, making, ready, done, cancelled)
--    visitor_orders.payment_status = status pembayaran (diisi server dari Midtrans)
-- ============================================================================
alter table public.visitor_orders
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_id uuid references public.payments (id) on delete set null,
  add column if not exists paid_at timestamptz;

alter table public.visitor_orders drop constraint if exists visitor_orders_payment_status_check;
alter table public.visitor_orders
  add constraint visitor_orders_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'));
create index if not exists visitor_orders_payment_idx on public.visitor_orders (payment_id);

-- Tenant hanya boleh mengubah status dapur pesanannya. Kolom pembayaran, total, dan
-- item tidak bisa diubah dari browser (sebelumnya policy mengizinkan semua kolom).
revoke update on public.visitor_orders from anon, authenticated;
grant update (status) on public.visitor_orders to authenticated;

-- Pesanan yang belum dibayar tidak boleh diproses dapur
create or replace function public.visitor_orders_guard_kitchen()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('making', 'ready', 'done')
     and new.payment_status <> 'paid' then
    raise exception 'Pesanan % belum dibayar, jadi belum bisa diproses.', new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists visitor_orders_kitchen_guard on public.visitor_orders;
create trigger visitor_orders_kitchen_guard before update on public.visitor_orders
  for each row execute function public.visitor_orders_guard_kitchen();

-- Pengunjung melacak pesanannya lewat kode pesanan; sekarang juga menampilkan status pembayaran
drop function if exists public.get_visitor_order(text);
create function public.get_visitor_order(p_id text)
returns table (
  id text,
  booth text,
  items jsonb,
  total numeric,
  status text,
  payment_status text,
  tenant_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.booth, o.items, o.total, o.status, o.payment_status, o.tenant_name, o.created_at
    from public.visitor_orders o
   where o.id = p_id;
$$;
grant execute on function public.get_visitor_order(text) to anon, authenticated;


-- ============================================================================
-- 5. FUNGSI TRANSAKSI (hanya bisa dipanggil server dengan service role)
-- ============================================================================

-- Pembayaran yang lewat batas waktu: lepas booth, batalkan pesanan.
-- (Snap tidak mengirim webhook ketika halaman Snap kedaluwarsa sebelum metode dipilih.)
create or replace function public.expire_stale_payments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  stale record;
begin
  for stale in
    select id, kind
      from public.payments
     where status = 'pending' and expires_at < now()
       for update skip locked
  loop
    update public.payments set status = 'expired' where id = stale.id;

    if stale.kind = 'booking' then
      update public.bookings
         set status = 'cancelled', payment = 'expired', reserved_until = null
       where payment_id = stale.id and status = 'pending';

      update public.booths b
         set reserved_until = null
        from public.bookings k
       where k.payment_id = stale.id
         and b.event_id = k.event_id
         and b.label = k.booth_label
         and not b.is_booked;
    else
      update public.visitor_orders
         set payment_status = 'expired',
             status = case when status = 'pending' then 'cancelled' else status end
       where payment_id = stale.id and payment_status = 'pending';
    end if;
  end loop;
end;
$$;

-- Sewa booth: validasi tenant & ketersediaan, hitung harga dari database, tahan booth,
-- catat pembayaran 'pending'. Booking baru menjadi 'confirmed' hanya lewat apply_payment_status().
create or replace function public.create_booth_payment(
  p_tenant_id uuid,
  p_event_id text,
  p_labels text[],
  p_order_id text,
  p_expiry_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
  ev public.events;
  bo public.booths;
  pay public.payments;
  labels text[];
  lbl text;
  n integer;
  free_tax boolean;
  line_items jsonb := '[]'::jsonb;
  rent bigint;
  tax_each bigint;
  fee_each bigint;
  tax_total bigint := 0;
  fee_total bigint := 0;
  grand bigint := 0;
  snap_expiry timestamptz;
  hold_until timestamptz;
begin
  select * into me from public.profiles where id = p_tenant_id;
  if me.id is null or me.role <> 'tenant' then
    raise exception 'Sewa booth hanya bisa dilakukan dengan akun tenant.';
  end if;

  select * into ev from public.events where id = p_event_id and status = 'published';
  if ev.id is null then
    raise exception 'Event tidak ditemukan atau belum diterbitkan.';
  end if;

  -- Label unik dan terurut, supaya baris booth selalu dikunci dengan urutan yang sama
  select coalesce(array_agg(distinct trim(l) order by trim(l)), '{}') into labels
    from unnest(coalesce(p_labels, '{}')) as l
   where trim(l) <> '';
  n := coalesce(array_length(labels, 1), 0);
  if n = 0 then
    raise exception 'Pilih minimal satu booth.';
  end if;
  if n > 10 then
    raise exception 'Maksimal 10 booth dalam satu pembayaran.';
  end if;
  if p_expiry_minutes is null or p_expiry_minutes < 5 or p_expiry_minutes > 1440 then
    raise exception 'Masa berlaku pembayaran tidak valid.';
  end if;

  perform public.expire_stale_payments();

  -- Pembayaran yang masih berjalan untuk himpunan booth yang sama dilanjutkan, bukan dibuat ulang
  select pm.* into pay
    from public.payments pm
   where pm.kind = 'booking'
     and pm.tenant_id = p_tenant_id
     and pm.event_id = p_event_id
     and pm.status = 'pending'
     and pm.snap_expires_at > now() + interval '1 minute'
     and (
       select coalesce(array_agg(k.booth_label order by k.booth_label), '{}')
         from public.bookings k
        where k.payment_id = pm.id
     ) = labels
   order by pm.created_at desc
   limit 1;

  if pay.id is not null then
    return jsonb_build_object(
      'reused', true,
      'payment_id', pay.id,
      'order_id', pay.order_id,
      'amount', pay.amount,
      'items', pay.items,
      'snap_token', pay.snap_token,
      'expires_at', pay.snap_expires_at,
      'customer', jsonb_build_object(
        'name', coalesce(nullif(me.business_name, ''), me.name),
        'email', me.email,
        'phone', me.phone
      )
    );
  end if;

  if exists (
    select 1 from public.bookings k
     where k.tenant_id = p_tenant_id
       and k.event_id = p_event_id
       and k.status = 'pending'
       and k.booth_label = any (labels)
  ) then
    raise exception 'Kamu masih punya pembayaran yang belum selesai untuk booth ini. Lanjutkan dari halaman Booth Saya, atau tunggu sampai kedaluwarsa.';
  end if;

  free_tax := public.event_campaign(p_event_id) is not null;
  fee_each := case when free_tax then 0 else 50000 end;

  -- Kunci tiap booth dan hitung harga dari tabel booths
  foreach lbl in array labels loop
    select * into bo from public.booths where event_id = p_event_id and label = lbl for update;
    if bo.id is null then
      raise exception 'Booth % tidak ada di denah event ini.', lbl;
    end if;
    if bo.is_booked or (bo.reserved_until is not null and bo.reserved_until > now()) then
      raise exception 'Booth % baru saja diambil tenant lain. Pilih booth lain.', lbl;
    end if;

    rent := round(bo.price)::bigint;
    tax_each := case when free_tax then 0 else round(rent * 0.11)::bigint end;
    grand := grand + rent + tax_each + fee_each;
    tax_total := tax_total + tax_each;
    fee_total := fee_total + fee_each;
    line_items := line_items || jsonb_build_object(
      'id', left('booth-' || lbl, 50),
      'name', left('Sewa booth ' || lbl, 50),
      'price', rent,
      'quantity', 1
    );
  end loop;

  if tax_total > 0 then
    line_items := line_items || jsonb_build_object('id', 'ppn-11', 'name', 'PPN 11%', 'price', tax_total, 'quantity', 1);
  end if;
  if fee_total > 0 then
    line_items := line_items || jsonb_build_object('id', 'service-fee', 'name', 'Biaya layanan', 'price', fee_each, 'quantity', n);
  end if;

  if grand <= 0 then
    raise exception 'Total pembayaran Rp 0 tidak bisa diproses lewat Midtrans.';
  end if;

  snap_expiry := now() + make_interval(mins => p_expiry_minutes);
  hold_until := snap_expiry + interval '2 minutes';

  insert into public.payments (order_id, kind, tenant_id, event_id, amount, items, snap_expires_at, expires_at)
  values (p_order_id, 'booking', p_tenant_id, p_event_id, grand, line_items, snap_expiry, hold_until)
  returning * into pay;

  foreach lbl in array labels loop
    select * into bo from public.booths where event_id = p_event_id and label = lbl;
    rent := round(bo.price)::bigint;
    tax_each := case when free_tax then 0 else round(rent * 0.11)::bigint end;

    insert into public.bookings (
      event_id, booth_label, tenant_id, tenant_name, event_title, event_date, zone,
      price, tax, service_fee, is_free_tax, payment_method,
      status, payment, payment_id, reserved_until
    )
    values (
      p_event_id, lbl, p_tenant_id, coalesce(nullif(me.business_name, ''), me.name), ev.title, ev.date, bo.zone,
      rent, tax_each, fee_each, free_tax, 'Midtrans',
      'pending', 'pending', pay.id, hold_until
    );

    update public.booths set reserved_until = hold_until where id = bo.id;
  end loop;

  return jsonb_build_object(
    'reused', false,
    'payment_id', pay.id,
    'order_id', pay.order_id,
    'amount', pay.amount,
    'items', pay.items,
    'snap_token', null,
    'expires_at', pay.snap_expires_at,
    'customer', jsonb_build_object(
      'name', coalesce(nullif(me.business_name, ''), me.name),
      'email', me.email,
      'phone', me.phone
    )
  );
end;
$$;

-- Pesanan pengunjung (boleh tamu): harga diambil dari menu tenant di database.
-- Status dapur 'pending' + payment_status 'pending' sampai Midtrans mengonfirmasi.
create or replace function public.create_visitor_order_payment(
  p_event_id text,
  p_booth text,
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_expiry_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  bk public.bookings;
  ev public.events;
  pay public.payments;
  menu_json jsonb;
  menu_item jsonb;
  item jsonb;
  merged jsonb := '{}'::jsonb;
  wanted_name text;
  qty integer;
  unit bigint;
  line_no integer := 0;
  clean_items jsonb := '[]'::jsonb;
  snap_items jsonb := '[]'::jsonb;
  grand bigint := 0;
  new_id text;
  cname text := trim(coalesce(p_customer_name, ''));
  cphone text := nullif(trim(coalesce(p_customer_phone, '')), '');
  snap_expiry timestamptz;
begin
  if p_expiry_minutes is null or p_expiry_minutes < 5 or p_expiry_minutes > 1440 then
    raise exception 'Masa berlaku pembayaran tidak valid.';
  end if;
  if cname = '' then
    raise exception 'Nama pemesan wajib diisi.';
  end if;
  if char_length(cname) > 80 or char_length(coalesce(cphone, '')) > 30 then
    raise exception 'Nama atau nomor telepon terlalu panjang.';
  end if;

  perform public.expire_stale_payments();

  select * into ev from public.events where id = p_event_id and status = 'published';
  if ev.id is null then
    raise exception 'Event tidak ditemukan.';
  end if;

  select * into bk from public.bookings
   where event_id = p_event_id and booth_label = p_booth and status = 'confirmed'
   limit 1;
  if bk.id is null then
    raise exception 'Booth % belum memiliki tenant.', p_booth;
  end if;

  select m.menu into menu_json from public.tenant_menus m where m.tenant_id = bk.tenant_id and m.event_id = p_event_id;
  menu_json := coalesce(menu_json, '[]'::jsonb);

  -- Gabungkan baris menu yang sama (browser tidak dipercaya)
  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    wanted_name := trim(coalesce(item ->> 'name', ''));
    qty := coalesce((item ->> 'qty')::integer, 0);
    if qty <= 0 then
      continue;
    end if;
    if wanted_name = '' then
      raise exception 'Nama menu wajib diisi.';
    end if;
    merged := jsonb_set(merged, array[wanted_name], to_jsonb(coalesce((merged ->> wanted_name)::integer, 0) + qty));
  end loop;

  if (select count(*) from jsonb_object_keys(merged)) = 0 then
    raise exception 'Keranjang kosong.';
  end if;
  if (select count(*) from jsonb_object_keys(merged)) > 30 then
    raise exception 'Maksimal 30 jenis menu dalam satu pesanan.';
  end if;

  for wanted_name, qty in select key, value::integer from jsonb_each_text(merged) loop
    if qty > 50 then
      raise exception 'Jumlah per menu maksimal 50.';
    end if;

    menu_item := null;
    select m.value into menu_item
      from jsonb_array_elements(menu_json) as m(value)
     where m.value ->> 'name' = wanted_name
     limit 1;
    if menu_item is null then
      raise exception 'Menu "%" tidak tersedia di booth ini.', wanted_name;
    end if;

    unit := round(coalesce((menu_item ->> 'price')::numeric, 0))::bigint;
    if unit < 0 then
      raise exception 'Harga menu "%" tidak valid.', wanted_name;
    end if;

    line_no := line_no + 1;
    grand := grand + unit * qty;
    clean_items := clean_items || jsonb_build_object(
      'name', menu_item ->> 'name',
      'price', unit,
      'qty', qty,
      'boothId', p_booth
    );
    snap_items := snap_items || jsonb_build_object(
      'id', 'item-' || line_no,
      'name', left(menu_item ->> 'name', 50),
      'price', unit,
      'quantity', qty
    );
  end loop;

  if grand <= 0 then
    raise exception 'Total pesanan harus lebih dari Rp 0.';
  end if;

  insert into public.visitor_orders (
    event_id, event_title, booth, items, total, customer_name, customer_phone,
    payment_method, status, payment_status, tenant_id, tenant_name
  )
  values (
    p_event_id, ev.title, p_booth, clean_items, grand, cname, cphone,
    'Midtrans', 'pending', 'pending', bk.tenant_id, bk.tenant_name
  )
  returning id into new_id;

  snap_expiry := now() + make_interval(mins => p_expiry_minutes);

  -- order_id Midtrans = kode pesanan (BF-XXXXXXXX)
  insert into public.payments (order_id, kind, tenant_id, event_id, amount, items, snap_expires_at, expires_at)
  values (new_id, 'visitor_order', bk.tenant_id, p_event_id, grand, snap_items, snap_expiry, snap_expiry + interval '2 minutes')
  returning * into pay;

  update public.visitor_orders set payment_id = pay.id where id = new_id;

  return jsonb_build_object(
    'order_id', new_id,
    'payment_id', pay.id,
    'amount', pay.amount,
    'items', pay.items,
    'access_token', pay.access_token,
    'expires_at', pay.snap_expires_at,
    'customer', jsonb_build_object('name', cname, 'phone', cphone)
  );
end;
$$;

-- Satu-satunya jalan mengubah status pembayaran. Dipanggil server setelah notifikasi Midtrans
-- diverifikasi (atau setelah Get Status API). Idempotent: memanggil ulang dengan data yang sama
-- tidak mengubah apa pun, dan status 'paid' tidak bisa turun kembali karena notifikasi yang terlambat.
create or replace function public.apply_payment_status(
  p_order_id text,
  p_new_status text,
  p_midtrans_status text,
  p_fraud_status text,
  p_status_code text,
  p_payment_type text,
  p_transaction_id text,
  p_event_key text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments;
  old_status text;
  next_status text;
  late_payment boolean;
  bk record;
  booth_conflict boolean := false;
begin
  if p_new_status not in ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded') then
    raise exception 'Status pembayaran tidak dikenal: %', p_new_status;
  end if;

  select * into pay from public.payments where order_id = p_order_id for update;
  if pay.id is null then
    return jsonb_build_object('found', false);
  end if;

  insert into public.payment_events (payment_id, event_key, midtrans_status, fraud_status, status_code, payload)
  values (pay.id, p_event_key, p_midtrans_status, p_fraud_status, p_status_code, coalesce(p_payload, '{}'::jsonb))
  on conflict (event_key) do nothing;

  old_status := pay.status;
  next_status := case
    when old_status = 'refunded' then 'refunded'
    when old_status = 'paid' then case when p_new_status = 'refunded' then 'refunded' else 'paid' end
    -- Sudah berakhir di sisi kita; hanya uang yang benar-benar masuk yang boleh mengubahnya
    when old_status in ('failed', 'expired', 'cancelled') then case when p_new_status = 'paid' then 'paid' else old_status end
    else p_new_status
  end;
  late_payment := old_status in ('failed', 'expired', 'cancelled') and next_status = 'paid';

  update public.payments
     set status = next_status,
         midtrans_status = case when next_status = p_new_status then coalesce(p_midtrans_status, midtrans_status) else midtrans_status end,
         fraud_status = case when next_status = p_new_status then coalesce(p_fraud_status, fraud_status) else fraud_status end,
         payment_type = coalesce(p_payment_type, payment_type),
         transaction_id = coalesce(p_transaction_id, transaction_id),
         paid_at = case when next_status = 'paid' and paid_at is null then now() else paid_at end
   where id = pay.id;

  if next_status = old_status and not late_payment then
    return jsonb_build_object('found', true, 'status', next_status, 'changed', false);
  end if;

  if pay.kind = 'booking' then
    if next_status = 'paid' then
      for bk in select * from public.bookings where payment_id = pay.id order by booth_label for update loop
        if bk.status = 'confirmed' then
          update public.bookings set payment = 'paid' where id = bk.id;
        elsif bk.status = 'pending'
           or (
             bk.status = 'cancelled'
             and exists (select 1 from public.booths b where b.event_id = bk.event_id and b.label = bk.booth_label
                          and not b.is_booked and (b.reserved_until is null or b.reserved_until <= now()))
             and not exists (select 1 from public.bookings o where o.event_id = bk.event_id and o.booth_label = bk.booth_label
                              and o.status in ('pending', 'confirmed') and o.id <> bk.id)
           ) then
          update public.bookings
             set status = 'confirmed', payment = 'paid', reserved_until = null,
                 payment_method = coalesce(nullif(p_payment_type, ''), payment_method)
           where id = bk.id;
          update public.booths
             set is_booked = true, tenant_id = bk.tenant_id, reserved_until = null
           where event_id = bk.event_id and label = bk.booth_label;
        else
          -- Uang masuk setelah booth dilepas dan sudah diambil pihak lain
          update public.bookings set payment = 'paid' where id = bk.id;
          booth_conflict := true;
        end if;
      end loop;

      if booth_conflict then
        update public.payments
           set needs_review = true,
               review_note = 'Pembayaran diterima setelah booth dilepas dan diambil pihak lain. Lakukan refund manual lewat dasbor Midtrans.'
         where id = pay.id;
      end if;

    elsif next_status in ('failed', 'expired', 'cancelled') then
      update public.bookings
         set status = 'cancelled', payment = next_status, reserved_until = null
       where payment_id = pay.id and status = 'pending';

      update public.booths b
         set reserved_until = null
        from public.bookings k
       where k.payment_id = pay.id
         and b.event_id = k.event_id
         and b.label = k.booth_label
         and not b.is_booked;

    elsif next_status = 'refunded' then
      update public.bookings set payment = 'refunded' where payment_id = pay.id;
    end if;

  else
    if next_status = 'paid' then
      update public.visitor_orders
         set payment_status = 'paid',
             paid_at = coalesce(paid_at, now()),
             payment_method = coalesce(nullif(p_payment_type, ''), payment_method),
             status = case when status = 'cancelled' then 'pending' else status end
       where payment_id = pay.id;
    elsif next_status in ('failed', 'expired', 'cancelled') then
      update public.visitor_orders
         set payment_status = next_status,
             status = case when status = 'pending' then 'cancelled' else status end
       where payment_id = pay.id and payment_status in ('unpaid', 'pending');
    elsif next_status = 'refunded' then
      update public.visitor_orders set payment_status = 'refunded' where payment_id = pay.id;
    end if;
  end if;

  return jsonb_build_object('found', true, 'status', next_status, 'changed', true, 'needs_review', booth_conflict);
end;
$$;


-- ============================================================================
-- 6. HAK AKSES FUNGSI
-- ============================================================================
revoke all on function public.expire_stale_payments() from public, anon, authenticated;
revoke all on function public.create_booth_payment(uuid, text, text[], text, integer) from public, anon, authenticated;
revoke all on function public.create_visitor_order_payment(text, text, jsonb, text, text, integer) from public, anon, authenticated;
revoke all on function public.apply_payment_status(text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;

grant execute on function public.expire_stale_payments() to service_role;
grant execute on function public.create_booth_payment(uuid, text, text[], text, integer) to service_role;
grant execute on function public.create_visitor_order_payment(text, text, jsonb, text, text, integer) to service_role;
grant execute on function public.apply_payment_status(text, text, text, text, text, text, text, text, jsonb) to service_role;

-- Dua fungsi lama membuat booking/pesanan tanpa pembayaran. Browser tidak boleh memanggilnya lagi.
revoke execute on function public.book_booths(text, text[], text) from public, anon, authenticated;
revoke execute on function public.place_visitor_order(text, text, jsonb, text, text, text) from public, anon, authenticated;
