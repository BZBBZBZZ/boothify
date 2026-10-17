-- ============================================================================
-- BOOTHIFY DATABASE SCHEMA FOR SUPABASE (POSTGRESQL)
-- Salin dan jalankan script ini di menu "SQL Editor" pada dashboard Supabase
-- ============================================================================

-- 1. Enable UUID extension jika diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PENGGUNA & PROFIL (USERS)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'organizer', 'tenant', 'guest')),
    business_name TEXT,
    business_category TEXT,
    phone TEXT,
    description TEXT,
    website TEXT,
    instagram TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL EVENT / PAMERAN (EVENTS)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT NOT NULL,
    country TEXT DEFAULT 'Indonesia',
    province TEXT,
    city TEXT,
    address TEXT,
    category TEXT NOT NULL,
    categories TEXT[] DEFAULT '{}',
    description TEXT,
    organizer TEXT NOT NULL,
    organizer_email TEXT,
    booths_filled INTEGER DEFAULT 0,
    booths_total INTEGER DEFAULT 0,
    price_range TEXT,
    image TEXT DEFAULT '🎪',
    gradient TEXT,
    zones JSONB DEFAULT '[]'::jsonb,
    highlights TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL DENAH BOOTH (FLOOR PLAN BOOTHS)
CREATE TABLE IF NOT EXISTS public.booths (
    id TEXT PRIMARY KEY, -- format: {event_id}_{label}, contoh: '1_A1'
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- contoh: 'A1', 'B2'
    zone TEXT NOT NULL,  -- contoh: 'fashion', 'fnb', 'craft'
    price NUMERIC NOT NULL DEFAULT 0,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    rotation NUMERIC DEFAULT 0,
    size_cm TEXT,
    is_booked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, label)
);

-- 5. TABEL PROFIL TENANT DI BOOTH (DIGITAL GUIDE & PANDUAN PENGUNJUNG)
CREATE TABLE IF NOT EXISTS public.booth_tenants (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    booth_label TEXT NOT NULL,
    name TEXT NOT NULL, -- Nama Brand Tenant
    tenant_email TEXT,
    category TEXT,
    zone TEXT,
    type TEXT DEFAULT 'non-fnb' CHECK (type IN ('fnb', 'non-fnb')),
    description TEXT,
    website TEXT,
    menu JSONB DEFAULT '[]'::jsonb,
    branding JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, booth_label)
);

-- 6. TABEL TRANSAKSI SEWA BOOTH OLEH TENANT (BOOKINGS)
CREATE TABLE IF NOT EXISTS public.tenant_bookings (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    event_title TEXT NOT NULL,
    booth TEXT NOT NULL,
    tenant_email TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    amount TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    payment TEXT DEFAULT 'paid' CHECK (payment IN ('paid', 'unpaid')),
    is_free_tax BOOLEAN DEFAULT FALSE,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL MASTER CAMPAIGN ADMIN (CAMPAIGNS)
CREATE TABLE IF NOT EXISTS public.admin_campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    theme TEXT NOT NULL,
    target_categories TEXT[] DEFAULT '{}',
    alignment_criteria TEXT[] DEFAULT '{}',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'closed')),
    icon TEXT DEFAULT '🎯',
    banner_gradient TEXT,
    benefits JSONB DEFAULT '{"freeTax": true, "priorityListing": true}'::jsonb,
    max_participants INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL PENGAJUAN KURASI DARI ORGANIZER KE CAMPAIGN ADMIN (APPLICATIONS)
CREATE TABLE IF NOT EXISTS public.campaign_applications (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES public.admin_campaigns(id) ON DELETE CASCADE,
    campaign_title TEXT NOT NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    event_category TEXT,
    event_location TEXT,
    event_date TEXT,
    organizer_email TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    submission_pitch TEXT NOT NULL,
    alignment_score INTEGER DEFAULT 80,
    alignment_breakdown JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABEL ORDER MAKANAN/MINUMAN PENGUNJUNG (VISITOR ORDERS)
CREATE TABLE IF NOT EXISTS public.visitor_orders (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    event_title TEXT,
    booth TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC NOT NULL DEFAULT 0,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    payment_method TEXT DEFAULT 'QRIS',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    tenant_email TEXT,
    tenant_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABEL PESAN MASUK DARI TENANT/PENGUNJUNG KE ORGANIZER (INBOX)
CREATE TABLE IF NOT EXISTS public.organizer_messages (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Untuk kemudahan awal dan kompatibilitas frontend, izinkan akses read & write:
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_messages ENABLE ROW LEVEL SECURITY;

-- Kebijakan baca publik (Public Read)
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Booths" ON public.booths FOR SELECT USING (true);
CREATE POLICY "Public Read Booth Tenants" ON public.booth_tenants FOR SELECT USING (true);
CREATE POLICY "Public Read Bookings" ON public.tenant_bookings FOR SELECT USING (true);
CREATE POLICY "Public Read Campaigns" ON public.admin_campaigns FOR SELECT USING (true);
CREATE POLICY "Public Read Applications" ON public.campaign_applications FOR SELECT USING (true);
CREATE POLICY "Public Read Orders" ON public.visitor_orders FOR SELECT USING (true);
CREATE POLICY "Public Read Messages" ON public.organizer_messages FOR SELECT USING (true);

-- Kebijakan modifikasi publik untuk demo/testing (Insert, Update, Delete)
CREATE POLICY "Public Insert Events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Public Insert Booths" ON public.booths FOR ALL USING (true);
CREATE POLICY "Public Manage Bookings" ON public.tenant_bookings FOR ALL USING (true);
CREATE POLICY "Public Manage Applications" ON public.campaign_applications FOR ALL USING (true);
CREATE POLICY "Public Manage Campaigns" ON public.admin_campaigns FOR ALL USING (true);
CREATE POLICY "Public Manage Orders" ON public.visitor_orders FOR ALL USING (true);
CREATE POLICY "Public Manage Messages" ON public.organizer_messages FOR ALL USING (true);
