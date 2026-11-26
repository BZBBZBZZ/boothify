-- ============================================================================
-- Hapus fitur campaign
-- ============================================================================
-- Jalankan di Supabase > SQL Editor SETELAH kode campaign dihapus dari app.
--
-- Kenapa perlu: harga sewa booth dihitung di database oleh fungsi book_booths().
-- Fungsi itu memanggil event_campaign() untuk memberi PPN 0% dan biaya layanan Rp 0
-- bagi event yang lolos campaign. Kalau fungsi ini tidak diubah, event lama yang
-- pernah lolos campaign tetap ditagih lebih murah di Midtrans daripada total yang
-- tampil di halaman checkout.
--
-- Setelah ini, event_campaign() selalu mengembalikan null, jadi semua sewa booth
-- dikenai PPN 11% dan biaya layanan Rp 50.000 per booth, sama seperti di layar.
-- ============================================================================

create or replace function public.event_campaign(p_event_id text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select null::uuid;
$$;

-- ----------------------------------------------------------------------------
-- OPSIONAL: hapus tabel campaign beserta seluruh datanya.
-- Aman dijalankan setelah fungsi di atas diganti, karena tidak ada lagi yang
-- memakai tabel ini. Data campaign akan hilang permanen, jadi hapus tanda "--"
-- di dua baris berikut hanya kalau kamu yakin.
-- ----------------------------------------------------------------------------
-- drop table if exists public.campaign_applications cascade;
-- drop table if exists public.campaigns cascade;
