# Boothify

Platform sewa booth event: organizer membuat event dan denah, tenant menyewa booth dan mengatur menu, pengunjung memesan lewat panduan digital. Semua data disimpan di Supabase.

## Menyiapkan database (sekali saja)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard), pilih project Boothify.
2. **SQL Editor > New query**, tempel seluruh isi `supabase/schema.sql`, klik **Run**.
   Script ini membuat semua tabel, aturan keamanan (RLS), fungsi transaksi, dan bucket file `uploads`.
   Tabel lama Boothify ikut dihapus, jadi data demo lama hilang. Akun di Authentication tidak terhapus.
3. **Authentication > Sign In / Providers > Email**:
   - Untuk pengembangan, matikan **Confirm email** supaya akun baru bisa langsung masuk.
   - Jika tetap dinyalakan, isi **Authentication > URL Configuration > Site URL** dengan alamat aplikasi
     (misalnya `http://localhost:3000`) supaya tautan konfirmasi kembali ke aplikasi.
4. Membuat akun admin: daftar akun biasa di `/auth/register`, lalu jalankan di SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';
   ```

## Menjalankan aplikasi

Isi `.env` (atau `.env.local`) dari **Project Settings > API**:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon / publishable key>"
```

Lalu:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur data

| Tabel | Isi |
| --- | --- |
| `profiles` | Satu baris per akun (organizer, tenant, admin), dibuat otomatis saat daftar |
| `events` | Event; `status` = `draft` (hanya terlihat pemilik) atau `published` |
| `booths` | Booth di denah; disimpan lewat fungsi `save_floor_plan` |
| `bookings` | Sewa booth; dibuat lewat fungsi `book_booths` yang mencegah booth disewa dua kali |
| `tenant_menus` | Menu tenant per event |
| `campaigns`, `campaign_applications` | Campaign admin dan pengajuan kurasi organizer |
| `visitor_orders` | Pesanan pengunjung; dibuat lewat `place_visitor_order`, harga diambil dari menu di database |
| `organizer_messages` | Pesan pengunjung/tenant ke organizer |

Semua akses data aplikasi ada di `app/lib/db.ts`.
