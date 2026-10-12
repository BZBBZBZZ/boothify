export type FloorPlanBooth = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  zone: string; // "fashion" | "fnb" | "craft" | "education" | "automotive" | "general"
  price: number;
};

export type EventTenantInfo = {
  id: string; // Booth label, e.g. "A1"
  name: string; // Brand Name
  category: string;
  zone?: string;
  type: "fnb" | "non-fnb";
  desc: string;
  tenantEmail?: string;
  website?: string;
  media?: string[];
  menu?: Array<{ name: string; price: number; image: string; description?: string }>;
  branding?: {
    headline: string;
    tagline: string;
    aboutText: string;
    primaryColor: string;
    instagram: string;
    website: string;
    highlights?: string[];
  };
};

export type EventDetail = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  address?: string;
  category: string;
  description: string;
  organizer: string;
  organizerEmail?: string;
  boothsFilled: number;
  boothsTotal: number;
  priceRange: string;
  image: string;
  gradient?: string;
  zones?: Array<{ name: string; booths: number; color: string }>;
  highlights?: string[];
};

export const DEFAULT_EVENTS_META: Record<string, EventDetail> = {
  "1": {
    id: "1",
    title: "Green Fashion Expo 2026",
    date: "15–17 November 2026",
    time: "10:00 – 21:00 WIB",
    location: "Jakarta Convention Center, Hall A",
    address: "Jl. Jend. Gatot Subroto, Senayan, Jakarta Pusat",
    category: "Fashion",
    description: "Pameran busana berkelanjutan terbesar di Asia Tenggara dengan konsep sirkular ramah lingkungan, instalasi seni daur ulang tekstil, dan panggung peragaan busana etis.",
    organizer: "PT. Event Kreasi Nusantara",
    organizerEmail: "demo-organizer@boothify.id",
    boothsFilled: 5,
    boothsTotal: 14,
    priceRange: "Rp 1.800.000 – Rp 3.000.000",
    image: "🌿",
    gradient: "from-emerald-500/20 to-teal-500/20",
    zones: [
      { name: "Zona A — Sustainable Fashion", booths: 5, color: "zone-fashion" },
      { name: "Zona B — F&B Corner & Kafe", booths: 5, color: "zone-fnb" },
      { name: "Zona C — Craft & Aksesoris Etnik", booths: 4, color: "zone-craft" },
    ],
    highlights: [
      "100+ brand busana ramah lingkungan",
      "Workshop upcycling & pewarnaan alami",
      "Panggung runway peragaan busana lokal",
      "Area kuliner eco-friendly tanpa plastik",
    ],
  },
  "2": {
    id: "2",
    title: "Indonesia Food Festival 2026",
    date: "22–24 November 2026",
    time: "09:00 – 22:00 WIB",
    location: "ICE BSD City, Tangerang",
    address: "Jl. BSD Grand Boulevard No.1, Pagedangan, Tangerang",
    category: "F&B",
    description: "Festival kuliner nusantara spektakuler menyajikan lebih dari 300 sajian otentik dari Sabang sampai Merauke, live cooking show chef ternama, dan area dessert modern.",
    organizer: "PT. Event Kreasi Nusantara",
    organizerEmail: "demo-organizer@boothify.id",
    boothsFilled: 3,
    boothsTotal: 10,
    priceRange: "Rp 2.500.000 – Rp 3.500.000",
    image: "🍜",
    gradient: "from-orange-500/20 to-amber-500/20",
    zones: [
      { name: "Zona F — Makanan Utama Nusantara", booths: 6, color: "zone-fnb" },
      { name: "Zona D — Kopi, Minuman & Dessert", booths: 4, color: "zone-fnb" },
    ],
    highlights: [
      "300+ ragam kuliner legendaris Indonesia",
      "Live cooking competition bersama MasterChef",
      "Kopi keliling & artisan tea tasting bar",
    ],
  },
  "3": {
    id: "3",
    title: "EduTech Innovation Fair 2026",
    date: "1–3 Desember 2026",
    time: "09:00 – 17:00 WIB",
    location: "Grand City Convention Hall, Surabaya",
    address: "Jl. Walikota Mustajab No.1, Ketabang, Surabaya",
    category: "Education",
    description: "Pameran inovasi teknologi pendidikan, robotika interaktif, AI classroom, dan kursus coding untuk generasi masa depan Indonesia.",
    organizer: "PT. Event Kreasi Nusantara",
    organizerEmail: "demo-organizer@boothify.id",
    boothsFilled: 2,
    boothsTotal: 8,
    priceRange: "Rp 2.000.000 – Rp 2.800.000",
    image: "📚",
    gradient: "from-violet-500/20 to-purple-500/20",
    zones: [
      { name: "Zona E — Edukasi & Kursus Coding", booths: 4, color: "zone-education" },
      { name: "Zona T — Robotika & Hardware Lab", booths: 4, color: "zone-education" },
    ],
    highlights: [
      "Booth interaktif robotik & simulator VR",
      "Workshop gratis coding web & mobile",
      "Beasiswa pendidikan untuk 500 pelajar",
    ],
  },
  "4": {
    id: "4",
    title: "AutoMotive Show 2026",
    date: "10–12 Desember 2026",
    time: "10:00 – 21:00 WIB",
    location: "JIEXPO Kemayoran, Hall C",
    address: "Jl. Benyamin Sueb, Kemayoran, Jakarta Pusat",
    category: "Automotive",
    description: "Pameran otomotif masa depan menampilkan mobil listrik terbaru, modifikasi kreatif, dan aksesori otomotif premium.",
    organizer: "PT. Event Kreasi Nusantara",
    organizerEmail: "demo-organizer@boothify.id",
    boothsFilled: 4,
    boothsTotal: 12,
    priceRange: "Rp 3.500.000 – Rp 5.000.000",
    image: "🚗",
    gradient: "from-blue-500/20 to-cyan-500/20",
    zones: [
      { name: "Zona V — Kendaraan & Mobil Listrik", booths: 6, color: "zone-automotive" },
      { name: "Zona A — Aksesori & Sparepart", booths: 6, color: "zone-automotive" },
    ],
  },
  "5": {
    id: "5",
    title: "Craft & Artisan Market 2026",
    date: "18–20 Desember 2026",
    time: "10:00 – 20:00 WIB",
    location: "Bandung Creative Hub",
    address: "Jl. Laswi No.7, Batununggal, Bandung",
    category: "Craft",
    description: "Pusat kreasi seni kriya, keramik buatan tangan, aksesoris kulit, dan produk handmade karya kreator lokal se-Jawa Barat.",
    organizer: "PT. Event Kreasi Nusantara",
    organizerEmail: "demo-organizer@boothify.id",
    boothsFilled: 3,
    boothsTotal: 10,
    priceRange: "Rp 1.200.000 – Rp 2.200.000",
    image: "🎨",
    gradient: "from-pink-500/20 to-rose-500/20",
    zones: [
      { name: "Zona K — Kerajinan & Keramik", booths: 5, color: "zone-craft" },
      { name: "Zona H — Handmade & Kulit", booths: 5, color: "zone-craft" },
    ],
  },
};

export const DEFAULT_EVENT_BOOTHS: Record<string, FloorPlanBooth[]> = {
  "1": [
    { id: "A1", x: 40, y: 70, width: 80, height: 60, label: "A1", zone: "fashion", price: 2500000 },
    { id: "A2", x: 140, y: 70, width: 80, height: 60, label: "A2", zone: "fashion", price: 2500000 },
    { id: "A3", x: 240, y: 70, width: 80, height: 60, label: "A3", zone: "fashion", price: 2500000 },
    { id: "A4", x: 340, y: 70, width: 80, height: 60, label: "A4", zone: "fashion", price: 2500000 },
    { id: "A5", x: 440, y: 70, width: 80, height: 60, label: "A5", zone: "fashion", price: 2500000 },
    { id: "B1", x: 40, y: 155, width: 80, height: 60, label: "B1", zone: "fnb", price: 3000000 },
    { id: "B2", x: 140, y: 155, width: 80, height: 60, label: "B2", zone: "fnb", price: 3000000 },
    { id: "B3", x: 240, y: 155, width: 80, height: 60, label: "B3", zone: "fnb", price: 3000000 },
    { id: "B4", x: 340, y: 155, width: 80, height: 60, label: "B4", zone: "fnb", price: 3000000 },
    { id: "B5", x: 440, y: 155, width: 80, height: 60, label: "B5", zone: "fnb", price: 3000000 },
    { id: "C1", x: 40, y: 240, width: 95, height: 65, label: "C1", zone: "fnb", price: 3000000 },
    { id: "C2", x: 165, y: 240, width: 95, height: 65, label: "C2", zone: "craft", price: 1800000 },
    { id: "C3", x: 290, y: 240, width: 95, height: 65, label: "C3", zone: "craft", price: 1800000 },
    { id: "C4", x: 415, y: 240, width: 95, height: 65, label: "C4", zone: "craft", price: 1800000 },
  ],
  "2": [
    { id: "F1", x: 40, y: 70, width: 80, height: 60, label: "F1", zone: "fnb", price: 3000000 },
    { id: "F2", x: 140, y: 70, width: 80, height: 60, label: "F2", zone: "fnb", price: 3000000 },
    { id: "F3", x: 240, y: 70, width: 80, height: 60, label: "F3", zone: "fnb", price: 3000000 },
    { id: "F4", x: 340, y: 70, width: 80, height: 60, label: "F4", zone: "fnb", price: 3000000 },
    { id: "F5", x: 440, y: 70, width: 80, height: 60, label: "F5", zone: "fnb", price: 3000000 },
    { id: "D1", x: 40, y: 165, width: 90, height: 65, label: "D1", zone: "fnb", price: 2500000 },
    { id: "D2", x: 160, y: 165, width: 90, height: 65, label: "D2", zone: "fnb", price: 2500000 },
    { id: "D3", x: 280, y: 165, width: 90, height: 65, label: "D3", zone: "fnb", price: 2500000 },
    { id: "D4", x: 400, y: 165, width: 90, height: 65, label: "D4", zone: "fnb", price: 2500000 },
  ],
  "3": [
    { id: "E1", x: 50, y: 80, width: 90, height: 65, label: "E1", zone: "education", price: 2000000 },
    { id: "E2", x: 165, y: 80, width: 90, height: 65, label: "E2", zone: "education", price: 2000000 },
    { id: "E3", x: 280, y: 80, width: 90, height: 65, label: "E3", zone: "education", price: 2000000 },
    { id: "E4", x: 395, y: 80, width: 90, height: 65, label: "E4", zone: "education", price: 2000000 },
    { id: "T1", x: 50, y: 180, width: 90, height: 65, label: "T1", zone: "education", price: 2500000 },
    { id: "T2", x: 165, y: 180, width: 90, height: 65, label: "T2", zone: "education", price: 2500000 },
    { id: "T3", x: 280, y: 180, width: 90, height: 65, label: "T3", zone: "education", price: 2500000 },
    { id: "T4", x: 395, y: 180, width: 90, height: 65, label: "T4", zone: "education", price: 2500000 },
  ],
};

export const DEFAULT_EVENT_TENANTS: Record<string, Record<string, EventTenantInfo>> = {
  "1": {
    "A1": {
      id: "A1",
      name: "EcoWear Studio",
      category: "Fashion",
      zone: "A",
      type: "non-fnb",
      desc: "Brand busana sirkular berkelanjutan dengan 100% serat alami & daur ulang tekstil dari Bandung.",
      tenantEmail: "demo-tenant@boothify.id",
      website: "https://ecowear.id",
      media: ["ecowear-lookbook-2026.pdf", "galeri-pewarna-alami.jpg"],
      branding: {
        headline: "EcoWear Studio",
        tagline: "Fashion yang Merawat Masa Depan Bumi 🌿",
        aboutText: "Kami adalah brand fashion sirkular berkelanjutan yang memanfaatkan 100% serat organik dan daur ulang tekstil dengan etika fair trade.",
        primaryColor: "#10b981",
        instagram: "@ecowearstudio",
        website: "https://ecowear.id",
        highlights: ["100% Daur Ulang", "Pewarna Alami", "Fair Trade Verified", "Zero Waste Packaging"],
      },
    },
    "A2": {
      id: "A2",
      name: "Green Threads",
      category: "Fashion",
      zone: "A",
      type: "non-fnb",
      desc: "Pakaian berbahan katun organik bersertifikasi GOTS dan linen ramah lingkungan.",
      tenantEmail: "greenthreads@boothify.id",
      website: "https://greenthreads.co",
      media: ["katalog-katun-organik.pdf"],
    },
    "B1": {
      id: "B1",
      name: "Nusantara Bites",
      category: "F&B",
      zone: "B",
      type: "fnb",
      desc: "Street food autentik Indonesia dengan bumbu rempah pilihan dan kemasan ramah lingkungan.",
      tenantEmail: "nusantarabites@boothify.id",
      menu: [
        { name: "Nasi Goreng Kampung", price: 25000, image: "🍛", description: "Bumbu terasi tradisional, suwir ayam & kerupuk" },
        { name: "Sate Ayam Madura", price: 20000, image: "🍢", description: "5 tusuk sate ayam lembut bumbu kacang gurih" },
        { name: "Pisang Goreng Crispy", price: 15000, image: "🍌", description: "Pisang kepok renyah dengan taburan gula kelapa" },
      ],
    },
    "C1": {
      id: "C1",
      name: "Kopi Keliling Nusantara",
      category: "F&B",
      zone: "C",
      type: "fnb",
      desc: "Specialty coffee booth portabel dengan biji kopi arabika & robusta lokal terbaik nusantara.",
      tenantEmail: "kopi@boothify.id",
      menu: [
        { name: "Kopi Susu Gula Aren", price: 22000, image: "☕", description: "Espresso robusta-arabika nusantara dengan gula aren murni & fresh milk" },
        { name: "Matcha Oat Latte", price: 28000, image: "🍵", description: "Matcha ceremonial Jepang berpadu creamy oat milk" },
        { name: "Butter Croissant", price: 18000, image: "🥐", description: "Flaky french butter croissant renyah dipanggang tiap pagi" },
        { name: "V60 Single Origin (Gayo)", price: 30000, image: "☕", description: "Manual brew filter coffee biji Aceh Gayo notes floral" },
      ],
      branding: {
        headline: "Kopi Keliling Nusantara",
        tagline: "Secangkir Cerita di Setiap Sudut Event ☕",
        aboutText: "Spesialisasi kopi keliling lokal bermutu tinggi menyajikan seduhan manual brew dan espresso machine portabel untuk memanjakan pengunjung expo.",
        primaryColor: "#d97706",
        instagram: "@kopikeliling.id",
        website: "https://kopikeliling.id",
        highlights: ["Manual Brew", "Espresso Bar", "Biji Kopi Nusantara"],
      },
    },
    "C3": {
      id: "C3",
      name: "CraftHouse Indonesia",
      category: "Craft",
      zone: "C",
      type: "non-fnb",
      desc: "Karya seni dekorasi dan perabot anyaman bambu & rotan ramah lingkungan karya perajin lokal.",
      tenantEmail: "crafthouse@boothify.id",
      website: "https://crafthouse.id",
      branding: {
        headline: "CraftHouse Indonesia",
        tagline: "Sentuhan Jiwa dalam Karya Seni Anyaman Tradisional",
        aboutText: "Menghubungkan ratusan perajin anyaman bambu dan rotan nusantara dengan pasar modern, menghadirkan dekorasi rumah bergaya etnik minimalis.",
        primaryColor: "#d97706",
        instagram: "@crafthouse.id",
        website: "https://crafthouse.id",
        highlights: ["Anyaman Bambu Alami", "Dibuat Manual dengan Tangan", "Pemberdayaan Pengrajin"],
      },
    },
  },
  "2": {
    "F1": {
      id: "F1",
      name: "Sate Ayam Madura Bu Senen",
      category: "F&B",
      zone: "F",
      type: "fnb",
      desc: "Sate ayam bakar arang batok kelapa resep turun temurun sejak 1982.",
      menu: [
        { name: "Sate Ayam Campur (10 tusuk)", price: 35000, image: "🍢" },
        { name: "Lontong Sayur Betawi", price: 25000, image: "🍲" },
      ],
    },
    "F2": {
      id: "F2",
      name: "Kopi Keliling Nusantara",
      category: "F&B",
      zone: "F",
      type: "fnb",
      desc: "Kopi susu aren andalan dan manual brew dingin untuk menemani petualangan kuliner Anda.",
      tenantEmail: "kopi@boothify.id",
      menu: [
        { name: "Kopi Susu Gula Aren", price: 22000, image: "☕" },
        { name: "Iced Tea Lemongrass", price: 15000, image: "🥤" },
      ],
    },
    "D1": {
      id: "D1",
      name: "Es Cendol Durian Bandung",
      category: "F&B",
      zone: "D",
      type: "fnb",
      desc: "Cendol tepung beras pandan suji asli berpadu daging durian Medan manis legit.",
      menu: [
        { name: "Es Cendol Durian Spesial", price: 28000, image: "🍧" },
        { name: "Es Cendol Nangka Santan Murni", price: 20000, image: "🍨" },
      ],
    },
  },
  "3": {
    "E1": {
      id: "E1",
      name: "Coding Academy Nusantara",
      category: "Education",
      zone: "E",
      type: "non-fnb",
      desc: "Sekolah pemrograman web, AI, dan game development untuk anak dan remaja.",
    },
    "T1": {
      id: "T1",
      name: "RoboKids Robotics Lab",
      category: "Education",
      zone: "T",
      type: "non-fnb",
      desc: "Kit edukasi robotika dan arena kompetisi battle bot interaktif.",
    },
  },
};

export function generateDefaultBoothsForEvent(eventId: string, category?: string): FloorPlanBooth[] {
  const cat = (category || "").toLowerCase();
  const zone = cat.includes("food") || cat.includes("fnb") || cat.includes("kuliner") ? "fnb"
    : cat.includes("fash") || cat.includes("mode") ? "fashion"
    : cat.includes("edu") || cat.includes("tech") ? "education"
    : cat.includes("auto") ? "automotive"
    : cat.includes("craft") || cat.includes("kriya") ? "craft"
    : "general";

  return [
    { id: "A1", x: 40, y: 70, width: 85, height: 60, label: "A1", zone, price: 2500000 },
    { id: "A2", x: 145, y: 70, width: 85, height: 60, label: "A2", zone, price: 2500000 },
    { id: "A3", x: 250, y: 70, width: 85, height: 60, label: "A3", zone, price: 2500000 },
    { id: "A4", x: 355, y: 70, width: 85, height: 60, label: "A4", zone, price: 2500000 },
    { id: "B1", x: 40, y: 160, width: 85, height: 60, label: "B1", zone, price: 2000000 },
    { id: "B2", x: 145, y: 160, width: 85, height: 60, label: "B2", zone, price: 2000000 },
    { id: "B3", x: 250, y: 160, width: 85, height: 60, label: "B3", zone, price: 2000000 },
    { id: "B4", x: 355, y: 160, width: 85, height: 60, label: "B4", zone, price: 2000000 },
  ];
}

/**
 * Initialize event floor plan and tenants in localStorage if not already present.
 */
export function ensureEventFloorPlanInitialized(eventId: string): {
  booths: FloorPlanBooth[];
  tenants: Record<string, EventTenantInfo>;
  booked: string[];
} {
  const meta = DEFAULT_EVENTS_META[eventId];
  const fallbackBooths = DEFAULT_EVENT_BOOTHS[eventId] || generateDefaultBoothsForEvent(eventId, meta?.category);
  const fallbackTenants = DEFAULT_EVENT_TENANTS[eventId] || {};

  if (typeof window === "undefined") {
    return {
      booths: fallbackBooths,
      tenants: fallbackTenants,
      booked: Object.keys(fallbackTenants),
    };
  }

  try {
    // 1. Floor plan booths
    const storedBoothsRaw = localStorage.getItem(`boothify_event_${eventId}_booths`);
    let booths: FloorPlanBooth[];
    if (storedBoothsRaw) {
      booths = JSON.parse(storedBoothsRaw);
    } else {
      booths = fallbackBooths;
      localStorage.setItem(`boothify_event_${eventId}_booths`, JSON.stringify(booths));
    }

    // 2. Booth tenants
    const storedTenantsRaw = localStorage.getItem(`boothify_event_${eventId}_booth_tenants`);
    let tenants: Record<string, EventTenantInfo>;
    if (storedTenantsRaw) {
      tenants = JSON.parse(storedTenantsRaw);
    } else {
      tenants = fallbackTenants;
      localStorage.setItem(`boothify_event_${eventId}_booth_tenants`, JSON.stringify(tenants));
    }

    // 3. Booked booths list
    const storedBookedRaw = localStorage.getItem(`boothify_event_${eventId}_booked_booths`);
    let booked: string[];
    if (storedBookedRaw) {
      booked = JSON.parse(storedBookedRaw);
    } else {
      booked = Object.keys(tenants);
      localStorage.setItem(`boothify_event_${eventId}_booked_booths`, JSON.stringify(booked));
    }

    return { booths, tenants, booked };
  } catch {
    return {
      booths: fallbackBooths,
      tenants: fallbackTenants,
      booked: Object.keys(fallbackTenants),
    };
  }
}

/**
 * Get unified event metadata (from localStorage if custom, or defaults)
 */
export function getEventMeta(eventId: string): EventDetail {
  if (typeof window !== "undefined") {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const found = storedEvents.find((e: { id: string }) => String(e.id) === String(eventId));
      if (found) {
        const base = DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"];
        return {
          ...base,
          ...found,
          highlights: base.highlights,
          zones: base.zones,
        };
      }
    } catch { /* ignore */ }
  }
  return (
    DEFAULT_EVENTS_META[eventId] || {
      id: eventId,
      title: `Event #${eventId}`,
      date: "Akan Datang 2026",
      location: "Venue Pameran Terpilih",
      category: "General",
      description: "Pameran resmi dengan tata letak booth eksklusif dan terstruktur.",
      organizer: "PT. Event Kreasi Nusantara",
      organizerEmail: "demo-organizer@boothify.id",
      boothsFilled: 0,
      boothsTotal: 10,
      priceRange: "Rp 2.000.000 – Rp 3.000.000",
      image: "🎪",
    }
  );
}

/**
 * Get all available events for Organizer management
 */
export function getAllOrganizerEvents(): Array<{ id: string; title: string; category: string; date: string }> {
  const baseList = [
    { id: "1", title: "Green Fashion Expo 2026", category: "Fashion", date: "15–17 Nov 2026" },
    { id: "2", title: "Indonesia Food Festival 2026", category: "F&B", date: "22–24 Nov 2026" },
    { id: "3", title: "EduTech Innovation Fair 2026", category: "Education", date: "1–3 Des 2026" },
    { id: "4", title: "AutoMotive Show 2026", category: "Automotive", date: "10–12 Des 2026" },
    { id: "5", title: "Craft & Artisan Market 2026", category: "Craft", date: "18–20 Des 2026" },
  ];

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        const custom = stored.map((e: { id: string; title: string; category?: string; date: string }) => ({
          id: String(e.id),
          title: e.title || `Event #${e.id}`,
          category: e.category || "General",
          date: e.date || "2026",
        }));
        const existingIds = new Set(custom.map((c: { id: string }) => c.id));
        const rem = baseList.filter((b) => !existingIds.has(b.id));
        return [...custom, ...rem];
      }
    } catch { /* ignore */ }
  }

  return baseList;
}

/**
 * Get currently active event ID for organizer dashboard
 */
export function getActiveOrganizerEventId(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("boothify_active_organizer_event_id");
      if (stored) return stored;
    } catch { /* ignore */ }
  }
  return "1";
}

/**
 * Set currently active event ID for organizer dashboard
 */
export function setActiveOrganizerEventId(id: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("boothify_active_organizer_event_id", id);
    } catch { /* ignore */ }
  }
}

