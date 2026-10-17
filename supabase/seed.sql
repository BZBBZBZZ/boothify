-- ============================================================================
-- BOOTHIFY INITIAL SEED DATA FOR SUPABASE
-- Jalankan script ini SETELAH menjalankan schema.sql di SQL Editor Supabase
-- ============================================================================

-- 1. SEED DATA PENGGUNA (USERS)
INSERT INTO public.users (id, name, email, role, business_name, business_category, phone, description, website, instagram)
VALUES
  ('usr_admin_01', 'Super Admin Boothify', 'admin@boothify.id', 'admin', 'Boothify HQ Management', 'platform', '+62 811 0000 9999', 'Platform Administrator & Official Campaign Curator', 'https://boothify.id', '@boothify.id'),
  ('usr_org_01', 'Budi Santoso', 'demo-organizer@boothify.id', 'organizer', 'PT. Event Kreasi Nusantara', 'event_organizer', '+62 812 3456 7890', 'Penyelenggara pameran, expo dan festival terkemuka di Indonesia', 'https://kreasi-expo.id', '@kreasiexpo.id'),
  ('usr_tenant_01', 'Siti Rahmawati', 'demo-tenant@boothify.id', 'tenant', 'EcoWear Studio', 'fashion', '+62 813 9876 5432', 'Brand fashion berkelanjutan dari bahan organik & daur ulang ramah lingkungan', 'https://ecowear.id', '@ecowearstudio'),
  ('usr_tenant_02', 'Ahmad Barista', 'kopi@boothify.id', 'tenant', 'Kopi Keliling Nusantara', 'fnb', '+62 878 1122 3344', 'Artisan coffee roastery & minuman kopi kekinian dengan biji kopi lokal nusantara', 'https://kopikeliling.id', '@kopikeliling.id')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED DATA EVENT / PAMERAN
INSERT INTO public.events (id, title, date, time, location, address, category, categories, description, organizer, organizer_email, booths_filled, booths_total, price_range, image, gradient, zones, highlights)
VALUES
  (
    '1',
    'Green Fashion Expo 2026',
    '15–17 November 2026',
    '10:00 – 21:00 WIB',
    'Jakarta Convention Center, Hall A',
    'Jl. Jend. Gatot Subroto, Senayan, Jakarta Pusat',
    'Fashion',
    ARRAY['Fashion, Beauty & Lifestyle', 'Lingkungan & Dampak Sosial'],
    'Pameran busana berkelanjutan terbesar di Asia Tenggara dengan konsep sirkular ramah lingkungan, instalasi seni daur ulang tekstil, dan panggung peragaan busana etis.',
    'PT. Event Kreasi Nusantara',
    'demo-organizer@boothify.id',
    5,
    9,
    'Rp 1.800.000 – Rp 3.000.000',
    '🌿',
    'from-emerald-500/20 to-teal-500/20',
    '[{"name": "Zona A — Sustainable Fashion", "booths": 4, "color": "zone-fashion"}, {"name": "Zona B — F&B Corner & Kafe", "booths": 3, "color": "zone-fnb"}, {"name": "Zona C — Craft & Aksesoris Etnik", "booths": 2, "color": "zone-craft"}]'::jsonb,
    ARRAY['100+ brand busana ramah lingkungan', 'Workshop upcycling & pewarnaan alami', 'Panggung runway peragaan busana lokal', 'Area kuliner eco-friendly tanpa plastik']
  ),
  (
    '2',
    'Indonesia Food Festival 2026',
    '22–24 November 2026',
    '09:00 – 22:00 WIB',
    'ICE BSD City, Hall 3',
    'Jl. BSD Grand Boulevard, Tangerang, Banten',
    'F&B',
    ARRAY['Kuliner (Food & Beverage)'],
    'Festival kuliner akbar nusantara menghadirkan 200+ cita rasa autentik daerah, masterclass chef nasional, dan zona artisan coffee.',
    'PT. Event Kreasi Nusantara',
    'demo-organizer@boothify.id',
    3,
    10,
    'Rp 2.000.000 – Rp 4.500.000',
    '🍜',
    'from-orange-500/20 to-red-500/20',
    '[{"name": "Zona Utama Kuliner", "booths": 6, "color": "zone-fnb"}, {"name": "Zona Minuman & Kopi", "booths": 4, "color": "zone-fnb"}]'::jsonb,
    ARRAY['200+ kuliner nusantara', 'Live cooking demo masterchef', 'Zona kopi & dessert artisanal']
  ),
  (
    '3',
    'EduTech Innovation Fair 2026',
    '1–3 Desember 2026',
    '09:00 – 18:00 WIB',
    'Grand City Surabaya, Convention Hall',
    'Jl. Walikota Mustajab No.1, Surabaya, Jawa Timur',
    'Education',
    ARRAY['Edukasi & Karir (Education & Career)', 'Teknologi'],
    'Eksplorasi masa depan pendidikan digital, AI pembelajaran, platform edtech terkini, dan beasiswa internasional.',
    'PT. Event Kreasi Nusantara',
    'demo-organizer@boothify.id',
    2,
    8,
    'Rp 1.800.000 – Rp 3.500.000',
    '📚',
    'from-violet-500/20 to-purple-500/20',
    '[{"name": "Zona EduTech & AI", "booths": 5, "color": "zone-edu"}, {"name": "Zona Beasiswa", "booths": 3, "color": "zone-edu"}]'::jsonb,
    ARRAY['50+ startup edtech terkemuka', 'Konsultasi beasiswa gratis', 'Kompetisi robotika pelajar']
  ),
  (
    '4',
    'AutoMotive Show 2026',
    '10–12 Desember 2026',
    '10:00 – 21:00 WIB',
    'JIEXPO Kemayoran, Hall C',
    'Jl. Benyamin Sueb, Kemayoran, Jakarta Pusat',
    'Automotive',
    ARRAY['Otomotif & Transportasi', 'Teknologi'],
    'Pameran otomotif masa depan menampilkan mobil listrik terbaru, modifikasi kreatif, dan aksesori otomotif premium.',
    'PT. Event Kreasi Nusantara',
    'demo-organizer@boothify.id',
    4,
    12,
    'Rp 3.500.000 – Rp 5.000.000',
    '🚗',
    'from-blue-500/20 to-cyan-500/20',
    '[{"name": "Zona V — Kendaraan & Mobil Listrik", "booths": 6, "color": "zone-automotive"}, {"name": "Zona A — Aksesori & Sparepart", "booths": 6, "color": "zone-automotive"}]'::jsonb,
    ARRAY['Mobil listrik generasi terbaru', 'Custom motorcycle showcase', 'Test drive indoor arena']
  ),
  (
    '5',
    'Craft & Artisan Market 2026',
    '18–20 Desember 2026',
    '10:00 – 20:00 WIB',
    'Bandung Creative Hub',
    'Jl. Laswi No.7, Batununggal, Bandung',
    'Craft',
    ARRAY['Kriya & Seni Rupa', 'Gaya Hidup'],
    'Pusat kreasi seni kriya, keramik buatan tangan, aksesoris kulit, dan produk handmade karya kreator lokal se-Jawa Barat.',
    'PT. Event Kreasi Nusantara',
    'demo-organizer@boothify.id',
    3,
    10,
    'Rp 1.200.000 – Rp 2.200.000',
    '🎨',
    'from-pink-500/20 to-rose-500/20',
    '[{"name": "Zona K — Kerajinan & Keramik", "booths": 5, "color": "zone-craft"}, {"name": "Zona H — Handmade & Kulit", "booths": 5, "color": "zone-craft"}]'::jsonb,
    ARRAY['Workshop tembikar & keramik', 'Pasar kulit artisanal Bandung', 'Live acoustic & art gallery']
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- 3. SEED DATA DENAH BOOTH (EVENT 1, 2, 3)
INSERT INTO public.booths (id, event_id, label, zone, price, x, y, width, height, rotation, size_cm, is_booked)
VALUES
  -- Event 1
  ('1_A1', '1', 'A1', 'fashion', 2500000, 100, 100, 100, 80, 0, '3x3m', true),
  ('1_A2', '1', 'A2', 'fashion', 2500000, 220, 100, 100, 80, 0, '3x3m', true),
  ('1_A3', '1', 'A3', 'fashion', 2200000, 340, 100, 100, 80, 0, '3x3m', false),
  ('1_A4', '1', 'A4', 'fashion', 2200000, 460, 100, 100, 80, 0, '3x3m', false),
  ('1_B1', '1', 'B1', 'fnb', 3000000, 100, 240, 120, 80, 0, '4x3m', true),
  ('1_B2', '1', 'B2', 'fnb', 2800000, 240, 240, 100, 80, 0, '3x3m', false),
  ('1_B3', '1', 'B3', 'fnb', 2800000, 360, 240, 100, 80, 0, '3x3m', false),
  ('1_C1', '1', 'C1', 'fnb', 3000000, 100, 380, 95, 70, 0, '3x2.5m', true),
  ('1_C2', '1', 'C2', 'craft', 1800000, 210, 380, 90, 70, 0, '2.5x2.5m', false),
  ('1_C3', '1', 'C3', 'craft', 1800000, 320, 380, 90, 70, 0, '2.5x2.5m', true),
  -- Event 2
  ('2_F1', '2', 'F1', 'fnb', 3000000, 100, 100, 100, 80, 0, '3x3m', true),
  ('2_F2', '2', 'F2', 'fnb', 3000000, 220, 100, 100, 80, 0, '3x3m', true),
  ('2_D1', '2', 'D1', 'fnb', 2500000, 100, 220, 100, 80, 0, '3x3m', true),
  -- Event 3
  ('3_E1', '3', 'E1', 'education', 2000000, 100, 100, 100, 80, 0, '3x3m', true),
  ('3_T1', '3', 'T1', 'education', 2500000, 220, 100, 100, 80, 0, '3x3m', true)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED DATA PROFIL TENANT DI BOOTH (DIGITAL GUIDE & INTERACTIVE CATALOG)
INSERT INTO public.booth_tenants (id, event_id, booth_label, name, tenant_email, category, zone, type, description, menu, branding)
VALUES
  (
    '1_A1_tenant',
    '1',
    'A1',
    'EcoWear Studio',
    'demo-tenant@boothify.id',
    'Fashion',
    'A',
    'non-fnb',
    'Pionir busana berkelanjutan lokal dengan bahan serat bambu organik & katun daur ulang.',
    '[{"name": "Organic Cotton T-Shirt", "price": 185000, "image": "👕", "description": "Kaos berbahan 100% serat katun organik tanpa pestisida"}, {"name": "Linen Outerwear Bandung", "price": 320000, "image": "🧥", "description": "Outer santai bahan linen natural hasil tenun perajin lokal"}]'::jsonb,
    '{"headline": "Sustainable Fashion Revolution", "tagline": "Tampil Gaya Tanpa Merusak Bumi 🌿", "primaryColor": "#10b981", "instagram": "@ecowearstudio", "website": "https://ecowear.id", "highlights": ["100% Daur Ulang", "Pewarna Alami", "Fair Trade Verified"]}'::jsonb
  ),
  (
    '1_A2_tenant',
    '1',
    'A2',
    'EcoWear Studio — Koleksi Katun',
    'demo-tenant@boothify.id',
    'Fashion',
    'A',
    'non-fnb',
    'Pakaian berbahan katun organik bersertifikasi GOTS dan linen ramah lingkungan karya EcoWear.',
    '[{"name": "GOTS Certified Shirt", "price": 210000, "image": "👔", "description": "Kemeja katun bersertifikat organik ramah kulit sensitif"}]'::jsonb,
    '{"headline": "EcoWear Cotton Line", "tagline": "Serat Alami Berkelanjutan", "primaryColor": "#10b981", "instagram": "@ecowearstudio", "website": "https://ecowear.id"}'::jsonb
  ),
  (
    '1_B1_tenant',
    '1',
    'B1',
    'Kopi Keliling Nusantara',
    'kopi@boothify.id',
    'Kuliner (Food & Beverage)',
    'B',
    'fnb',
    'Kopi artisan single-origin asli nusantara disajikan segar dari biji kopi pilihan petani lokal.',
    '[{"name": "Kopi Susu Gula Aren", "price": 22000, "description": "Espresso blend nusantara dengan gula aren murni dan susu segar"}, {"name": "Butter Croissant", "price": 18000, "description": "Croissant butter renyah untuk teman minum kopi"}]'::jsonb,
    '{"headline": "Secangkir Cerita Nusantara", "tagline": "Dari Petani Lokal Langsung ke Cangkirmu ☕", "primaryColor": "#d97706", "instagram": "@kopikeliling.id", "website": "https://kopikeliling.id"}'::jsonb
  ),
  (
    '1_C1_tenant',
    '1',
    'C1',
    'Kopi Keliling Nusantara',
    'kopi@boothify.id',
    'Kuliner (Food & Beverage)',
    'C',
    'fnb',
    'Specialty coffee booth portabel dengan biji kopi arabika & robusta lokal terbaik nusantara.',
    '[{"name": "Kopi Susu Gula Aren", "price": 22000, "image": "☕", "description": "Espresso robusta-arabika nusantara dengan gula aren murni & fresh milk"}, {"name": "Cold Brew Aceh Gayo", "price": 28000, "image": "☕", "description": "Ekstraksi dingin 16 jam rasa fruity lembut"}]'::jsonb,
    '{"headline": "Kopi Keliling Nusantara", "tagline": "Secangkir Cerita di Setiap Sudut Event ☕", "primaryColor": "#d97706", "instagram": "@kopikeliling.id", "website": "https://kopikeliling.id"}'::jsonb
  ),
  (
    '1_C3_tenant',
    '1',
    'C3',
    'EcoWear Craft & Totebag',
    'demo-tenant@boothify.id',
    'Craft',
    'C',
    'non-fnb',
    'Koleksi aksesoris, perabot anyaman ramah lingkungan, dan denim totebag kreasi perajin mitra EcoWear.',
    '[{"name": "Upcycled Denim Totebag", "price": 95000, "image": "👜", "description": "Tas jinjing daur ulang perca denim berkualitas tinggi"}]'::jsonb,
    '{"headline": "EcoWear Craft Studio", "tagline": "Sentuhan Kriya & Aksesoris Berkelanjutan", "primaryColor": "#10b981", "instagram": "@ecowearstudio", "website": "https://ecowear.id"}'::jsonb
  ),
  (
    '2_F1_tenant',
    '2',
    'F1',
    'Sate Nusantara by Kopi Keliling',
    'kopi@boothify.id',
    'F&B',
    'F',
    'fnb',
    'Sate ayam bakar arang batok kelapa resep turun temurun sejak 1982.',
    '[{"name": "Sate Ayam Campur (10 tusuk)", "price": 35000, "image": "🍢"}]'::jsonb,
    '{"headline": "Sate Nusantara Asli", "tagline": "Aroma Bakaran Tradisional", "primaryColor": "#ef4444", "instagram": "@satenusantara", "website": "https://satenusantara.id"}'::jsonb
  ),
  (
    '2_F2_tenant',
    '2',
    'F2',
    'Kopi Keliling Nusantara',
    'kopi@boothify.id',
    'F&B',
    'F',
    'fnb',
    'Kopi susu aren andalan dan manual brew dingin untuk menemani petualangan kuliner Anda.',
    '[{"name": "Kopi Susu Gula Aren", "price": 22000, "image": "☕"}]'::jsonb,
    '{"headline": "Kopi Segar Festival", "tagline": "Teman Menikmati Kuliner", "primaryColor": "#d97706", "instagram": "@kopikeliling.id", "website": "https://kopikeliling.id"}'::jsonb
  ),
  (
    '2_D1_tenant',
    '2',
    'D1',
    'Es Cendol Durian by Kopi Keliling',
    'kopi@boothify.id',
    'F&B',
    'D',
    'fnb',
    'Cendol tepung beras pandan suji asli berpadu daging durian Medan manis legit.',
    '[{"name": "Es Cendol Durian Spesial", "price": 28000, "image": "🍧"}]'::jsonb,
    '{"headline": "Es Cendol Durian", "tagline": "Manis Segar Durian Asli", "primaryColor": "#f59e0b", "instagram": "@cendoldurian", "website": "https://cendoldurian.id"}'::jsonb
  ),
  (
    '3_E1_tenant',
    '3',
    'E1',
    'EcoWear Digital Merchandise',
    'demo-tenant@boothify.id',
    'Education',
    'E',
    'non-fnb',
    'Merchandise resmi dan starter pack coding kit ramah lingkungan.',
    '[{"name": "Student Coding Hoodie", "price": 250000, "image": "🧥", "description": "Hoodie katun organik untuk coder muda"}]'::jsonb,
    '{"headline": "EduTech Merch", "tagline": "Style Pintar untuk Coder Muda", "primaryColor": "#8b5cf6", "instagram": "@edutechmerch", "website": "https://edutechmerch.id"}'::jsonb
  ),
  (
    '3_T1_tenant',
    '3',
    'T1',
    'Kopi Keliling Tech Barista',
    'kopi@boothify.id',
    'Education',
    'T',
    'fnb',
    'Booth kopi specialty otomatis dengan simulator barista edukatif.',
    '[{"name": "Cold Brew Smart Bottle", "price": 30000, "image": "☕", "description": "Cold brew kemasan botol siap minum"}]'::jsonb,
    '{"headline": "Smart Barista Lab", "tagline": "Kopi & Teknologi AI", "primaryColor": "#d97706", "instagram": "@kopikeliling.id", "website": "https://kopikeliling.id"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 5. SEED DATA MASTER CAMPAIGN ADMIN
INSERT INTO public.admin_campaigns (id, title, tagline, description, theme, target_categories, alignment_criteria, start_date, end_date, status, icon, banner_gradient, benefits, max_participants)
VALUES
  (
    'camp_01',
    'Festival Belanja Kreatif Nusantara 2026',
    'Akselerasi UMKM & Industri Kreatif Lokal ke Panggung Nasional',
    'Program kurasi nasional yang mengintegrasikan pameran mode, kuliner, dan kriya unggulan Indonesia. Diselenggarakan bersama kurator Boothify dengan dukungan bebas pajak transaksi sewa booth untuk seluruh tenant partisipan.',
    'Ekonomi Kreatif & Produk Lokal Unggulan',
    ARRAY['Fashion', 'Kuliner', 'Kriya', 'Multi-Industri'],
    ARRAY['Mengutamakan produk lokal & karya desainer/artisan mandiri', 'Memiliki standar tata letak pameran profesional & ramah pengunjung', 'Komitmen bebas plastik sekali pakai pada area operasional pameran', 'Menyediakan fasilitas transaksi digital terpadu (QRIS/Transfer)'],
    '01 Nov 2026',
    '31 Des 2026',
    'active',
    '🛍️',
    'from-amber-500/20 via-primary/20 to-purple-500/20',
    '{"freeTax": true, "highlightBadge": "🌟 Official Admin Campaign", "priorityListing": true, "description": "Bebas Pajak (PPN 0%) transaksi sewa booth tenant dan pin sorotan prioritas pada halaman Jelajahi Event."}'::jsonb,
    10
  ),
  (
    'camp_02',
    'Indonesia Sustainable Living & Eco Expo 2026',
    'Gerakan Pameran Hijau, Sirkular, dan Ramah Lingkungan',
    'Kampanye kurasi khusus untuk pameran yang mengedepankan prinsip keberlanjutan, material ramah lingkungan, dan efisiensi jejak karbon. Tenant yang bergabung pada event terpilih dibebaskan dari pajak sewa booth.',
    'Keberlanjutan & Zero Waste Lifestyle',
    ARRAY['Fashion', 'Kuliner', 'Gaya Hidup', 'Edukasi'],
    ARRAY['Dekorasi booth menggunakan material daur ulang atau modular ramah lingkungan', 'Manajemen limbah sampah organik & non-organik terpisah', 'Menyediakan edukasi sirkular atau workshop upcycling', 'Tidak memperbolehkan styrofoam & plastik kantong sekali pakai'],
    '10 Nov 2026',
    '20 Des 2026',
    'active',
    '🌱',
    'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    '{"freeTax": true, "highlightBadge": "🌿 Eco Verified Campaign", "priorityListing": true, "description": "Bebas Pajak (PPN 0%) transaksi sewa booth tenant dan lencana verifikasi ramah lingkungan resmi Boothify."}'::jsonb,
    8
  )
ON CONFLICT (id) DO NOTHING;

-- 6. SEED DATA PENGAJUAN KURASI CAMPAIGN
INSERT INTO public.campaign_applications (id, campaign_id, campaign_title, event_id, event_title, event_category, event_location, event_date, organizer_email, organizer_name, submission_pitch, alignment_score, alignment_breakdown, status, admin_notes, reviewed_at)
VALUES
  (
    'app_demo_01',
    'camp_01',
    'Festival Belanja Kreatif Nusantara 2026',
    '1',
    'Green Fashion Expo 2026',
    'Fashion',
    'Jakarta Convention Center, Hall A',
    '15–17 Nov 2026',
    'demo-organizer@boothify.id',
    'PT. Event Kreasi Nusantara',
    'Green Fashion Expo 2026 mengkurasi 100+ brand busana lokal ramah lingkungan dan instalasi upcycling. Konsep ini selaras penuh dengan pilar festival belanja kreatif nasional yang mengedepankan artisan karya anak bangsa.',
    92,
    '{"categoryMatch": 95, "themeMatch": 90, "scaleMatch": 90}'::jsonb,
    'approved',
    'Konsep sangat selaras dengan pilar ekonomi kreatif dan keberlanjutan. Disetujui masuk campaign dengan benefit Free Tax tenant dan status Highlight.',
    timezone('utc'::text, now())
  )
ON CONFLICT (id) DO NOTHING;

-- 7. SEED DATA TRANSAKSI SEWA BOOTH
INSERT INTO public.tenant_bookings (id, event_id, event_title, booth, tenant_email, tenant_name, amount, status, payment, is_free_tax, date)
VALUES
  ('bk_01', '1', 'Green Fashion Expo 2026', 'A1', 'demo-tenant@boothify.id', 'EcoWear Studio', 'Rp 2.500.000', 'confirmed', 'paid', true, '15–17 Nov 2026'),
  ('bk_02', '1', 'Green Fashion Expo 2026', 'B1', 'kopi@boothify.id', 'Kopi Keliling Nusantara', 'Rp 3.000.000', 'confirmed', 'paid', true, '15–17 Nov 2026')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED DATA ORDER MAKANAN/PRODUK PENGUNJUNG
INSERT INTO public.visitor_orders (id, event_id, event_title, booth, items, total, customer_name, customer_phone, payment_method, status, tenant_email, tenant_name)
VALUES
  (
    'BF-ORDER-9931',
    '1',
    'Green Fashion Expo 2026',
    'A1',
    '[{"boothId": "A1", "name": "Organic Cotton T-Shirt", "qty": 1, "price": 185000}]'::jsonb,
    185000,
    'Andi Pengunjung',
    '+62 811 2233 4455',
    'QRIS',
    'pending',
    'demo-tenant@boothify.id',
    'EcoWear Studio'
  ),
  (
    'BF-ORDER-8821',
    '1',
    'Green Fashion Expo 2026',
    'B1',
    '[{"name": "Kopi Susu Gula Aren", "qty": 2, "price": 22000}]'::jsonb,
    44000,
    'Rian Pratama',
    '+62 812 9988 7766',
    'QRIS',
    'completed',
    'kopi@boothify.id',
    'Kopi Keliling Nusantara'
  )
ON CONFLICT (id) DO NOTHING;

-- 9. SEED DATA PESAN MASUK ORGANIZER (INBOX)
INSERT INTO public.organizer_messages (id, event_id, event_title, organizer_email, sender_name, sender_email, sender_phone, message, status)
VALUES
  (
    'msg_01',
    '1',
    'Green Fashion Expo 2026',
    'demo-organizer@boothify.id',
    'Siti Rahmawati (EcoWear Studio)',
    'demo-tenant@boothify.id',
    '+62 813 9876 5432',
    'Halo kak, kami dari EcoWear Studio sudah submit pelunasan booth A1 zona Sustainable Fashion. Mohon konfirmasi jadwal loading barang H-1 ya kak. Terima kasih!',
    'unread'
  ),
  (
    'msg_02',
    '1',
    'Green Fashion Expo 2026',
    'demo-organizer@boothify.id',
    'Ahmad Barista (Kopi Keliling)',
    'kopi@boothify.id',
    '+62 878 1122 3344',
    'Selamat siang tim panitia, apakah kapasitas daya listrik 1300 watt di Booth B1 F&B sudah termasuk fasilitas pendingin es?',
    'unread'
  )
ON CONFLICT (id) DO NOTHING;
