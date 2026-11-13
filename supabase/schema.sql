-- ============================================================================
-- BOOTHIFY DATABASE SCHEMA (Supabase / PostgreSQL)
--
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New query, tempel SELURUH
-- isi file ini, lalu klik Run. Script ini aman dijalankan ulang.
--
-- PERHATIAN: bagian "RESET" menghapus tabel lama Boothify beserta seluruh isinya
-- (termasuk data demo lama). Akun di Authentication > Users TIDAK ikut terhapus.
-- ============================================================================


-- ============================================================================
-- 0. RESET: hapus struktur lama (versi demo dan versi ini)
-- ============================================================================
drop view if exists public.event_tenants cascade;

drop table if exists public.organizer_messages cascade;
drop table if exists public.visitor_orders cascade;
drop table if exists public.campaign_applications cascade;
drop table if exists public.admin_campaigns cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.tenant_menus cascade;
drop table if exists public.booth_tenants cascade;
drop table if exists public.tenant_bookings cascade;
drop table if exists public.bookings cascade;
drop table if exists public.booths cascade;
drop table if exists public.events cascade;
drop table if exists public.users cascade;
drop table if exists public.profiles cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.current_role_is(text) cascade;
drop function if exists public.refresh_event_booth_counts(text) cascade;
drop function if exists public.booths_changed() cascade;
drop function if exists public.touch_updated_at() cascade;
drop function if exists public.save_floor_plan(text, jsonb, jsonb, jsonb, boolean) cascade;
drop function if exists public.book_booths(text, text[], text) cascade;
drop function if exists public.place_visitor_order(text, text, jsonb, text, text, text) cascade;
drop function if exists public.get_visitor_order(text) cascade;
drop function if exists public.send_organizer_message(text, text, text, text, text) cascade;
drop function if exists public.event_campaign(text) cascade;
drop function if exists public.get_event_tenants(text) cascade;

-- ============================================================================
-- 1. PROFIL PENGGUNA (1 baris per akun di Authentication > Users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  role text not null default 'tenant' check (role in ('admin', 'organizer', 'tenant')),
  business_name text,
  business_category text,
  phone text,
  description text,
  website text,
  instagram text,
  logo_url text,
  -- Tenant: jenis katalog, media promosi, dan tampilan mini website
  catalog_type text not null default 'non-fnb' check (catalog_type in ('fnb', 'non-fnb')),
  media_files jsonb not null default '[]'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Profil dibuat otomatis saat seseorang mendaftar (data diambil dari form daftar).
-- Peran admin tidak bisa dipilih dari form; lihat README di bawah file ini.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := meta ->> 'role';
begin
  insert into public.profiles (id, email, name, role, business_name, business_category, phone, description, catalog_type)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(meta ->> 'name', ''), split_part(new.email, '@', 1)),
    case when wanted in ('organizer', 'tenant') then wanted else 'tenant' end,
    nullif(meta ->> 'business_name', ''),
    nullif(meta ->> 'business_category', ''),
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'description', ''),
    case when meta ->> 'business_category' = 'fnb' then 'fnb' else 'non-fnb' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Akun yang sudah ada di Authentication sebelum script ini dijalankan tetap punya profil
insert into public.profiles (id, email, name, role)
select u.id, lower(u.email), coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
       case when u.raw_user_meta_data ->> 'role' in ('organizer', 'tenant') then u.raw_user_meta_data ->> 'role' else 'tenant' end
from auth.users u
where u.email is not null
on conflict (id) do nothing;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.current_role_is(wanted text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = wanted);
$$;

-- ============================================================================
-- 2. EVENT
-- ============================================================================
create table public.events (
  id text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  organizer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  organizer text not null default '',
  organizer_email text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  title text not null,
  date text not null default '',
  time text,
  location text not null default '',
  country text default 'Indonesia',
  province text,
  city text,
  address text,
  category text not null default 'Umum',
  categories text[] not null default '{}',
  description text not null default '',
  theme text,
  guidelines text,
  price_range text not null default '',
  image text not null default '',
  highlights text[] not null default '{}',
  floor_zones jsonb,
  floor_objects jsonb not null default '[]'::jsonb,
  booths_total integer not null default 0,
  booths_filled integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_organizer_idx on public.events (organizer_id);
create index events_status_idx on public.events (status);

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 3. BOOTH DI DENAH
-- ============================================================================
create table public.booths (
  id text primary key, -- {event_id}_{label}
  event_id text not null references public.events (id) on delete cascade,
  label text not null,
  zone text not null default 'general',
  price numeric not null default 0 check (price >= 0),
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 80,
  height numeric not null default 60,
  rotation numeric not null default 0,
  size_cm text,
  is_booked boolean not null default false,
  tenant_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, label)
);
create index booths_event_idx on public.booths (event_id);

-- Jumlah booth & booth terisi pada event selalu dihitung dari tabel booths
create function public.refresh_event_booth_counts(p_event_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.events e
     set booths_total = (select count(*) from public.booths b where b.event_id = p_event_id),
         booths_filled = (select count(*) from public.booths b where b.event_id = p_event_id and b.is_booked),
         price_range = coalesce((
           select case when min(b.price) = max(b.price)
                       then 'Rp ' || replace(to_char(min(b.price), 'FM999,999,999,999'), ',', '.')
                       else 'Rp ' || replace(to_char(min(b.price), 'FM999,999,999,999'), ',', '.')
                            || ' – Rp ' || replace(to_char(max(b.price), 'FM999,999,999,999'), ',', '.')
                  end
             from public.booths b where b.event_id = p_event_id
         ), '')
   where e.id = p_event_id;
$$;

create function public.booths_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_event_booth_counts(old.event_id);
    return old;
  end if;
  perform public.refresh_event_booth_counts(new.event_id);
  return new;
end;
$$;

create trigger booths_counts after insert or update or delete on public.booths
  for each row execute function public.booths_changed();

-- ============================================================================
-- 4. SEWA BOOTH OLEH TENANT
-- ============================================================================
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  booth_label text not null,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  tenant_name text not null default '',
  event_title text not null default '',
  event_date text not null default '',
  zone text,
  price numeric not null default 0,
  tax numeric not null default 0,
  service_fee numeric not null default 0,
  is_free_tax boolean not null default false,
  payment_method text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  payment text not null default 'paid' check (payment in ('paid', 'unpaid')),
  created_at timestamptz not null default now()
);
create unique index bookings_one_tenant_per_booth on public.bookings (event_id, booth_label) where status = 'confirmed';
create index bookings_tenant_idx on public.bookings (tenant_id);
create index bookings_event_idx on public.bookings (event_id);

-- Menu (F&B / produk) tenant, diatur per event
create table public.tenant_menus (
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  event_id text not null references public.events (id) on delete cascade,
  menu jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, event_id)
);

-- ============================================================================
-- 5. CAMPAIGN ADMIN & PENGAJUAN KURASI
-- ============================================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tagline text not null default '',
  description text not null,
  theme text not null default '',
  target_categories text[] not null default '{}',
  alignment_criteria text[] not null default '{}',
  start_date text not null default '',
  end_date text not null default '',
  status text not null default 'active' check (status in ('active', 'draft', 'closed')),
  banner_gradient text,
  benefits jsonb not null default '{"freeTax": true, "priorityListing": true, "highlightBadge": "Official Campaign", "description": "Bebas pajak sewa booth"}'::jsonb,
  max_participants integer not null default 10,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  campaign_title text not null default '',
  event_id text not null references public.events (id) on delete cascade,
  event_title text not null default '',
  event_category text,
  event_location text,
  event_date text,
  organizer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  organizer_email text not null default '',
  organizer_name text not null default '',
  submission_pitch text not null,
  alignment_score integer not null default 0,
  alignment_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, event_id)
);

-- ============================================================================
-- 6. PESANAN PENGUNJUNG & PESAN KE ORGANIZER
-- ============================================================================
create table public.visitor_orders (
  id text primary key default ('BF-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  event_id text not null references public.events (id) on delete cascade,
  event_title text not null default '',
  booth text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  customer_name text not null,
  customer_phone text,
  payment_method text not null default 'QRIS',
  status text not null default 'pending' check (status in ('pending', 'making', 'ready', 'done', 'cancelled')),
  tenant_id uuid references public.profiles (id) on delete set null,
  tenant_name text,
  created_at timestamptz not null default now()
);
create index visitor_orders_tenant_idx on public.visitor_orders (tenant_id);

create table public.organizer_messages (
  id uuid primary key default gen_random_uuid(),
  event_id text references public.events (id) on delete cascade,
  event_title text not null default '',
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  sender_phone text,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'replied')),
  created_at timestamptz not null default now()
);
create index organizer_messages_owner_idx on public.organizer_messages (organizer_id);

-- ============================================================================
-- 7. DATA PUBLIK: tenant di setiap booth (untuk panduan pengunjung)
-- Fungsi (bukan view) supaya hanya kolom publik ini yang bisa dibaca, per event.
-- ============================================================================
create function public.get_event_tenants(p_event_id text)
returns table (
  booth_label text,
  tenant_id uuid,
  name text,
  category text,
  type text,
  description text,
  website text,
  instagram text,
  phone text,
  logo_url text,
  branding jsonb,
  media_files jsonb,
  menu jsonb,
  zone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.booth_label,
    b.tenant_id,
    coalesce(nullif(p.business_name, ''), p.name),
    p.business_category,
    p.catalog_type,
    coalesce(p.description, ''),
    p.website,
    p.instagram,
    p.phone,
    p.logo_url,
    p.branding,
    p.media_files,
    coalesce(m.menu, '[]'::jsonb),
    bo.zone
  from public.bookings b
  join public.events e on e.id = b.event_id and e.status = 'published'
  join public.profiles p on p.id = b.tenant_id
  left join public.tenant_menus m on m.tenant_id = b.tenant_id and m.event_id = b.event_id
  left join public.booths bo on bo.event_id = b.event_id and bo.label = b.booth_label
  where b.event_id = p_event_id and b.status = 'confirmed';
$$;

-- ============================================================================
-- 8. FUNGSI TRANSAKSI (dijalankan di server database, aman dari manipulasi browser)
-- ============================================================================

-- Simpan denah booth. Booth yang sudah disewa tidak bisa dihapus dan status sewanya tetap.
create function public.save_floor_plan(
  p_event_id text,
  p_booths jsonb,
  p_zones jsonb,
  p_objects jsonb,
  p_publish boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.events;
  item jsonb;
  labels text[];
  locked text[];
begin
  select * into ev from public.events where id = p_event_id;
  if ev.id is null or ev.organizer_id <> auth.uid() then
    raise exception 'Event tidak ditemukan atau bukan milik akun ini.';
  end if;

  select coalesce(array_agg(trim(x ->> 'label')), '{}') into labels from jsonb_array_elements(p_booths) x;
  if exists (select 1 from unnest(labels) l where l is null or l = '') then
    raise exception 'Setiap booth harus punya label.';
  end if;
  if (select count(*) from unnest(labels)) <> (select count(distinct l) from unnest(labels) l) then
    raise exception 'Ada label booth yang sama. Setiap booth harus punya label unik.';
  end if;

  select coalesce(array_agg(label), '{}') into locked
    from public.booths
   where event_id = p_event_id and is_booked and not (label = any (labels));
  if array_length(locked, 1) > 0 then
    raise exception 'Booth % sudah disewa tenant dan tidak bisa dihapus.', array_to_string(locked, ', ');
  end if;

  delete from public.booths where event_id = p_event_id and not (label = any (labels));

  for item in select * from jsonb_array_elements(p_booths) loop
    insert into public.booths (id, event_id, label, zone, price, x, y, width, height, rotation, size_cm)
    values (
      p_event_id || '_' || trim(item ->> 'label'),
      p_event_id,
      trim(item ->> 'label'),
      coalesce(nullif(item ->> 'zone', ''), 'general'),
      greatest(coalesce((item ->> 'price')::numeric, 0), 0),
      coalesce((item ->> 'x')::numeric, 0),
      coalesce((item ->> 'y')::numeric, 0),
      coalesce((item ->> 'width')::numeric, 80),
      coalesce((item ->> 'height')::numeric, 60),
      coalesce((item ->> 'rotation')::numeric, 0),
      nullif(item ->> 'sizeCm', '')
    )
    on conflict (event_id, label) do update
      set zone = excluded.zone,
          price = excluded.price,
          x = excluded.x,
          y = excluded.y,
          width = excluded.width,
          height = excluded.height,
          rotation = excluded.rotation,
          size_cm = excluded.size_cm;
  end loop;

  update public.events
     set floor_zones = p_zones,
         floor_objects = coalesce(p_objects, '[]'::jsonb),
         status = case when p_publish then 'published' else status end
   where id = p_event_id;

  perform public.refresh_event_booth_counts(p_event_id);
  return jsonb_build_object('ok', true, 'booths', array_length(labels, 1));
end;
$$;

-- Campaign yang meloloskan sebuah event (dipakai untuk bebas pajak)
create function public.event_campaign(p_event_id text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.campaign_id
    from public.campaign_applications a
    join public.campaigns c on c.id = a.campaign_id
   where a.event_id = p_event_id and a.status = 'approved' and c.status <> 'draft'
   limit 1;
$$;

-- Sewa booth: cek ketersediaan, hitung harga dari database, catat booking.
create function public.book_booths(p_event_id text, p_labels text[], p_payment_method text)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.profiles;
  ev public.events;
  bo public.booths;
  rec public.bookings;
  free_tax boolean;
  lbl text;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null or me.role <> 'tenant' then
    raise exception 'Sewa booth hanya bisa dilakukan dengan akun tenant.';
  end if;

  select * into ev from public.events where id = p_event_id and status = 'published';
  if ev.id is null then
    raise exception 'Event tidak ditemukan atau belum diterbitkan.';
  end if;

  if p_labels is null or array_length(p_labels, 1) is null then
    raise exception 'Pilih minimal satu booth.';
  end if;

  free_tax := public.event_campaign(p_event_id) is not null;

  foreach lbl in array p_labels loop
    select * into bo from public.booths where event_id = p_event_id and label = lbl for update;
    if bo.id is null then
      raise exception 'Booth % tidak ada di denah event ini.', lbl;
    end if;
    if bo.is_booked then
      raise exception 'Booth % baru saja disewa tenant lain. Pilih booth lain.', lbl;
    end if;

    update public.booths set is_booked = true, tenant_id = me.id where id = bo.id;

    insert into public.bookings (event_id, booth_label, tenant_id, tenant_name, event_title, event_date, zone, price, tax, service_fee, is_free_tax, payment_method)
    values (
      p_event_id, lbl, me.id, coalesce(nullif(me.business_name, ''), me.name), ev.title, ev.date, bo.zone, bo.price,
      case when free_tax then 0 else round(bo.price * 0.11) end,
      case when free_tax then 0 else 50000 end,
      free_tax,
      p_payment_method
    )
    returning * into rec;
    return next rec;
  end loop;
  return;
end;
$$;

-- Pesanan pengunjung: harga diambil dari menu tenant di database, bukan dari browser.
create function public.place_visitor_order(
  p_event_id text,
  p_booth text,
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_payment_method text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  bk public.bookings;
  ev public.events;
  menu jsonb;
  item jsonb;
  found jsonb;
  qty integer;
  clean_items jsonb := '[]'::jsonb;
  grand numeric := 0;
  new_id text;
begin
  select * into ev from public.events where id = p_event_id and status = 'published';
  if ev.id is null then
    raise exception 'Event tidak ditemukan.';
  end if;

  select * into bk from public.bookings where event_id = p_event_id and booth_label = p_booth and status = 'confirmed' limit 1;
  if bk.id is null then
    raise exception 'Booth % belum memiliki tenant.', p_booth;
  end if;

  select m.menu into menu from public.tenant_menus m where m.tenant_id = bk.tenant_id and m.event_id = p_event_id;
  menu := coalesce(menu, '[]'::jsonb);

  if coalesce(trim(p_customer_name), '') = '' then
    raise exception 'Nama pemesan wajib diisi.';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    qty := greatest(coalesce((item ->> 'qty')::integer, 0), 0);
    continue when qty = 0;
    found := null;
    select m.value into found from jsonb_array_elements(menu) as m(value) where m.value ->> 'name' = item ->> 'name' limit 1;
    if found is null then
      raise exception 'Menu "%" tidak tersedia di booth ini.', item ->> 'name';
    end if;
    clean_items := clean_items || jsonb_build_object(
      'name', found ->> 'name',
      'price', coalesce((found ->> 'price')::numeric, 0),
      'qty', qty,
      'boothId', p_booth
    );
    grand := grand + coalesce((found ->> 'price')::numeric, 0) * qty;
  end loop;

  if jsonb_array_length(clean_items) = 0 then
    raise exception 'Keranjang kosong.';
  end if;

  insert into public.visitor_orders (event_id, event_title, booth, items, total, customer_name, customer_phone, payment_method, tenant_id, tenant_name)
  values (p_event_id, ev.title, p_booth, clean_items, grand, trim(p_customer_name), nullif(trim(coalesce(p_customer_phone, '')), ''),
          coalesce(nullif(p_payment_method, ''), 'QRIS'), bk.tenant_id, bk.tenant_name)
  returning id into new_id;
  return new_id;
end;
$$;

-- Pengunjung melacak pesanannya sendiri lewat kode pesanan
create function public.get_visitor_order(p_id text)
returns table (id text, booth text, items jsonb, total numeric, status text, tenant_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.booth, o.items, o.total, o.status, o.tenant_name, o.created_at
    from public.visitor_orders o
   where o.id = p_id;
$$;

-- Pesan dari pengunjung/tenant ke organizer event
create function public.send_organizer_message(
  p_event_id text,
  p_sender_name text,
  p_sender_email text,
  p_sender_phone text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.events;
  new_id uuid;
begin
  select * into ev from public.events where id = p_event_id and status = 'published';
  if ev.id is null then
    raise exception 'Event tidak ditemukan.';
  end if;
  if coalesce(trim(p_sender_name), '') = '' or coalesce(trim(p_sender_email), '') = '' or coalesce(trim(p_message), '') = '' then
    raise exception 'Nama, email, dan pesan wajib diisi.';
  end if;
  insert into public.organizer_messages (event_id, event_title, organizer_id, sender_name, sender_email, sender_phone, message)
  values (ev.id, ev.title, ev.organizer_id, trim(p_sender_name), trim(p_sender_email), nullif(trim(coalesce(p_sender_phone, '')), ''), trim(p_message))
  returning id into new_id;
  return new_id;
end;
$$;

-- ============================================================================
-- 9. KEAMANAN (ROW LEVEL SECURITY)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.booths enable row level security;
alter table public.bookings enable row level security;
alter table public.tenant_menus enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_applications enable row level security;
alter table public.visitor_orders enable row level security;
alter table public.organizer_messages enable row level security;

-- Profil: info bisnis tampil publik (nama brand, kontak); hanya pemilik yang bisa mengubah
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Kolom role & email tidak bisa diubah sendiri dari aplikasi
revoke update on public.profiles from anon, authenticated;
grant update (name, business_name, business_category, phone, description, website, instagram, logo_url, catalog_type, media_files, branding)
  on public.profiles to authenticated;

-- Event: yang sudah terbit tampil publik; draft hanya untuk pemiliknya
create policy "events_read" on public.events for select
  using (status = 'published' or organizer_id = auth.uid() or public.is_admin());
create policy "events_insert" on public.events for insert
  with check (organizer_id = auth.uid() and public.current_role_is('organizer'));
create policy "events_update" on public.events for update
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "events_delete" on public.events for delete
  using (organizer_id = auth.uid() and booths_filled = 0);

-- Booth: dibaca jika event-nya terlihat; diubah lewat fungsi save_floor_plan
create policy "booths_read" on public.booths for select
  using (exists (select 1 from public.events e where e.id = event_id));

-- Booking: tenant melihat miliknya, organizer melihat booking di event miliknya; dibuat lewat book_booths
create policy "bookings_read" on public.bookings for select
  using (
    tenant_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
    or public.is_admin()
  );

-- Menu tenant: publik untuk dibaca, hanya tenant pemilik yang menulis (dan hanya di event yang dia sewa)
create policy "menus_read" on public.tenant_menus for select using (true);
create policy "menus_insert" on public.tenant_menus for insert
  with check (
    tenant_id = auth.uid()
    and exists (select 1 from public.bookings b where b.event_id = tenant_menus.event_id and b.tenant_id = auth.uid() and b.status = 'confirmed')
  );
create policy "menus_update" on public.tenant_menus for update
  using (tenant_id = auth.uid()) with check (tenant_id = auth.uid());
create policy "menus_delete" on public.tenant_menus for delete using (tenant_id = auth.uid());

-- Campaign: yang aktif/selesai publik; dikelola admin
create policy "campaigns_read" on public.campaigns for select using (status <> 'draft' or public.is_admin());
create policy "campaigns_admin_write" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- Pengajuan kurasi: organizer mengajukan event miliknya; admin meninjau; yang disetujui terlihat publik
create policy "applications_read" on public.campaign_applications for select
  using (status = 'approved' or organizer_id = auth.uid() or public.is_admin());
create policy "applications_insert" on public.campaign_applications for insert
  with check (
    organizer_id = auth.uid()
    and status = 'pending'
    and exists (select 1 from public.events e where e.id = event_id and e.organizer_id = auth.uid())
  );
create policy "applications_admin_update" on public.campaign_applications for update
  using (public.is_admin()) with check (public.is_admin());

-- Pesanan pengunjung: dibuat lewat place_visitor_order; tenant mengelola pesanan booth-nya
create policy "orders_tenant_read" on public.visitor_orders for select using (tenant_id = auth.uid());
create policy "orders_tenant_update" on public.visitor_orders for update
  using (tenant_id = auth.uid()) with check (tenant_id = auth.uid());

-- Pesan: dikirim lewat send_organizer_message; organizer membaca & mengelola inbox-nya
create policy "messages_owner_read" on public.organizer_messages for select using (organizer_id = auth.uid());
create policy "messages_owner_update" on public.organizer_messages for update
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "messages_owner_delete" on public.organizer_messages for delete using (organizer_id = auth.uid());

-- Hak akses fungsi & view
grant execute on function public.get_event_tenants(text) to anon, authenticated;
revoke all on function public.save_floor_plan(text, jsonb, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_floor_plan(text, jsonb, jsonb, jsonb, boolean) to authenticated;
revoke all on function public.book_booths(text, text[], text) from public, anon;
grant execute on function public.book_booths(text, text[], text) to authenticated;
grant execute on function public.place_visitor_order(text, text, jsonb, text, text, text) to anon, authenticated;
grant execute on function public.get_visitor_order(text) to anon, authenticated;
grant execute on function public.send_organizer_message(text, text, text, text, text) to anon, authenticated;
grant execute on function public.event_campaign(text) to anon, authenticated;
revoke all on function public.refresh_event_booth_counts(text) from public, anon, authenticated;

-- ============================================================================
-- 10. PENYIMPANAN FILE (logo, gambar menu, brosur, video, banner event)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', true, 20971520)
on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "uploads_public_read" on storage.objects;
drop policy if exists "uploads_owner_insert" on storage.objects;
drop policy if exists "uploads_owner_update" on storage.objects;
drop policy if exists "uploads_owner_delete" on storage.objects;

create policy "uploads_public_read" on storage.objects for select
  using (bucket_id = 'uploads');
create policy "uploads_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- MEMBUAT AKUN ADMIN
-- 1. Daftar akun biasa lewat halaman /auth/register (pilih peran apa saja).
-- 2. Jalankan (ganti emailnya):
--      update public.profiles set role = 'admin' where email = 'email-admin@contoh.com';
-- ============================================================================
