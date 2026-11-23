# Catatan perubahan Boothify

## Langkah wajib setelah menyalin kode

1. Timpa folder `app/` lama dengan folder `app/` dari zip ini.
2. Jalankan `supabase/migrations/20261123_event_facilities.sql` di **Supabase → SQL Editor** (menambah kolom fasilitas booth di tabel `events`).
   Tanpa migrasi ini app tetap jalan, tapi menyimpan fasilitas akan gagal dengan pesan yang menyuruh menjalankan file ini.
3. `npm run dev`, lalu cek halaman: daftar, dasbor organizer, buat event, halaman event, katalog tenant.

## 1. Flow pendaftaran + onboarding

- `app/auth/register/page.tsx`: ditulis ulang.
  - Stepper berlabel (Pilih peran → Data akun → Profil usaha/organisasi), tampil di desktop dan HP.
  - Kartu peran berupa radio, dengan daftar apa yang bisa dilakukan tiap peran.
  - Tombol Kembali tidak lagi menghapus isian.
  - Tiap field punya label, tanda wajib/opsional, dan petunjuk singkat.
  - Panel kiri menampilkan langkah setelah daftar sesuai peran.
- `app/components/OnboardingGuide.tsx` (baru): checklist "Mulai di sini" di dasbor organizer dan tenant.
  Progres dihitung dari data akun (profil lengkap, sudah punya event/booking, dll.), bisa disembunyikan dan dimunculkan lagi.

## 2. Konsistensi desain

- `app/components/ui.tsx` (baru): `PageHeader`, `SectionTitle`, `Tabs`/`TabPanel`, `Notice`, `Field`, `EmptyState`, `Stepper`.
- `app/globals.css`: blok "SHARED PATTERNS" di `@layer components` (header halaman, tab, notice, hint field, stepper, onboarding, fasilitas, empty state).
- Semua judul halaman memakai `page-header-title`, semua label memakai `field-label`, pesan error memakai satu gaya notice.
- Tombol berwarna khusus (ungu/hijau) diseragamkan ke `btn-primary`, sisa warna tema gelap lama (`white/10`, `#1e2a4a`) dibuang, overlay modal dan toast memakai kelas yang sudah ada.

## 3. Label & bahasa

- Seluruh UI memakai Bahasa Indonesia dengan sapaan "kamu" ("Anda" sudah diganti semua).
- Istilah Inggris diganti, misalnya Free Tax → bebas pajak (PPN 0%), Floor Plan → Denah Booth, Dashboard → Dasbor, Real-Time Sync, Builder, Merchant, E-Pass.
- "Organizer" dan "Tenant" tetap dipakai sebagai nama peran (dijelaskan di halaman daftar).
- Label field memakai sentence case, dan label dihubungkan ke input (`htmlFor`/`id`), termasuk form edit menu, edit booth di denah, profil, dan form kontak organizer.

## 4. Info fasilitas booth

- `app/components/BoothFacilities.tsx` (baru):
  - `FacilityPicker`: organizer menandai tiap fasilitas *Disediakan* / *Tidak*, dan bisa menambah item sendiri.
  - `FacilityList`: menampilkan dua kolom, "Disediakan organizer" dan "Tidak disediakan (bawa sendiri)".
- Data: `facilitiesIncluded` dan `facilitiesExcluded` ditambahkan di `EventDetail` dan `lib/db.ts`.
- Fasilitas muncul di:
  - form buat event dan edit event,
  - tab Informasi Event (bersama Panduan untuk tenant),
  - ringkasan sewa booth,
  - halaman checkout tenant.

## 5. Struktur halaman (dipecah jadi langkah/tab)

| Halaman | Sebelumnya | Sekarang |
|---|---|---|
| Buat event | 1 form panjang | 3 langkah: Info event → Waktu & lokasi → Fasilitas & aturan → lanjut ke denah |
| Edit event | 8 field berderet | Tab: Info event / Waktu & lokasi / Fasilitas & aturan |
| Katalog tenant | Menu + media di 1 halaman | Tab: Menu per event / Media promosi |
| Program campaign organizer | 2 daftar panjang | Tab: Campaign tersedia / Pengajuan saya |
| Halaman event, Pesanan & booth, Admin | Tab buatan sendiri, gayanya beda-beda | Komponen `Tabs` yang sama |

## Yang belum dicek

Pengecekan sintaks dan tipe TypeScript sudah lolos, tapi app belum dijalankan di browser karena paket npm tidak tersedia di lingkungan pengerjaan.
Tolong cek tampilan dengan `npm run dev`.
