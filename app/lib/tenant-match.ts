import { getEventCategoryLabel, getEventCategoryValue } from "./event-categories";
import { DEFAULT_EVENTS_META } from "./event-defaults";

export interface TenantProfile {
  brandName: string;
  category: string;
  email: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
}

export interface MatchPillar {
  id: "category" | "sustainability" | "booth" | "traffic";
  name: string;
  weight: number;
  weightLabel: string;
  score: number;
  color: string;
  reason: string;
}

export interface MatchBreakdown {
  categoryScore: number;
  sustainabilityScore: number;
  boothScore: number;
  trafficScore: number;
  overallScore: number;
  match: string;
  matchLevel: "high" | "medium" | "low";
  pillars: MatchPillar[];
  categoryReason: string;
  sustainabilityReason: string;
  boothReason: string;
  trafficReason: string;
  highlights: string[];
}

/**
 * Mengambil profil tenant yang sedang login dari localStorage atau fallback default
 */
export function getLoggedInTenantProfile(email?: string): TenantProfile {
  const fallbackEmail = email || "demo-tenant@boothify.id";
  const isKopi = fallbackEmail.toLowerCase().includes("kopi");

  if (typeof window !== "undefined") {
    try {
      // 1. Cek profil per-email
      const storedPerEmail = localStorage.getItem(`boothify_profile_${fallbackEmail}`);
      if (storedPerEmail) {
        return JSON.parse(storedPerEmail);
      }

      // 2. Cek profil umum tenant
      const storedTenant = localStorage.getItem("boothify_tenant_profile");
      if (storedTenant) {
        const parsed = JSON.parse(storedTenant);
        if (parsed.email === fallbackEmail || !email) {
          return parsed;
        }
      }

      // 3. Cek user yang sedang login di auth
      const storedCurrent = localStorage.getItem("boothify_current_user");
      if (storedCurrent) {
        const user = JSON.parse(storedCurrent);
        if (user && user.role === "tenant") {
          return {
            brandName: user.businessName || user.name || (isKopi ? "Kopi Keliling Nusantara" : "EcoWear Studio"),
            category: user.businessCategory || user.category || (isKopi ? "fnb" : "fashion"),
            email: user.email || fallbackEmail,
            phone: user.phone || "+62 813 9876 5432",
            description: user.description || (isKopi
              ? "Artisan coffee roastery dan minuman kopi kekinian dengan biji kopi lokal nusantara."
              : "Brand fashion berkelanjutan dari bahan organik dan daur ulang ramah lingkungan."),
            website: user.website || (isKopi ? "https://kopikeliling.id" : "https://ecowear.id"),
            instagram: user.instagram || (isKopi ? "@kopikeliling.id" : "@ecowearstudio"),
          };
        }
      }
    } catch {
      // Abaikan parsing error, gunakan fallback
    }
  }

  // Default fallback profil demo
  if (isKopi) {
    return {
      brandName: "Kopi Keliling Nusantara",
      category: "fnb",
      email: "kopi@boothify.id",
      phone: "+62 878 1122 3344",
      description: "Artisan coffee roastery dan minuman kopi kekinian dengan biji kopi lokal nusantara.",
      website: "https://kopikeliling.id",
      instagram: "@kopikeliling.id",
    };
  }

  return {
    brandName: "EcoWear Studio",
    category: "fashion",
    email: "demo-tenant@boothify.id",
    phone: "+62 813 9876 5432",
    description: "Brand fashion berkelanjutan yang menggunakan 100% bahan daur ulang ramah lingkungan dengan prinsip fair trade.",
    website: "https://ecowear.id",
    instagram: "@ecowearstudio",
  };
}

/**
 * Mesin kalkulasi kecocokan multi-kriteria antara Tenant Profile dengan Event
 * Membagi evaluasi ke dalam 4 pilar:
 * 1. Kategori & Industri (Bobot 35%) -> Warna #10b981
 * 2. Tema & Keselarasan Nilai Keberlanjutan (Bobot 25%) -> Warna #34d399
 * 3. Ketersediaan Booth di Venue (Bobot 20%) -> Warna #61c5b4
 * 4. Potensi Sinergi Audiens & Traffic (Bobot 20%) -> Warna #3b82f6
 */
export function calculateEventTenantMatch(
  event: {
    id: string;
    title?: string;
    category?: string;
    categories?: string[];
    categoryKeys?: string[];
    description?: string;
    location?: string;
    city?: string;
    province?: string;
    booths?: number;
    boothsTotal?: number;
    boothsFilled?: number;
  },
  tenantProfile?: TenantProfile | null
): MatchBreakdown {
  const profile = tenantProfile || getLoggedInTenantProfile();
  const eventMeta = DEFAULT_EVENTS_META[event.id];

  const tenantCatVal = getEventCategoryValue(profile.category || "fashion").toLowerCase();
  const tenantCatLabel = getEventCategoryLabel(profile.category || "fashion");
  const tenantDesc = (profile.description || "").toLowerCase();
  const tenantBrand = (profile.brandName || "").toLowerCase();

  const eventTitle = (event.title || eventMeta?.title || "").toLowerCase();
  const eventDesc = (event.description || eventMeta?.description || "").toLowerCase();
  const eventCat = (event.category || eventMeta?.category || "").toLowerCase();
  const eventLocation = (event.location || eventMeta?.location || "").toLowerCase();
  const eventCategories = (event.categories || eventMeta?.categories || []).map((c) => c.toLowerCase());
  const eventCategoryKeys = (event.categoryKeys || eventMeta?.categoryKeys || []).map((k) => k.toLowerCase());
  const eventZones = eventMeta?.zones || [];
  const eventHighlights = (eventMeta?.highlights || []).map((h) => h.toLowerCase());

  // =========================================================================
  // PILAR 1: Kategori & Industri (Bobot 35%)
  // =========================================================================
  let categoryScore = 40;
  let categoryReason = `Kategori pameran (${event.category || "Umum"}) berbeda dari lini utama produk Anda.`;

  const isExactCategory =
    eventCat.includes(tenantCatVal) ||
    eventCat.includes(tenantCatLabel.toLowerCase()) ||
    eventCategories.some((c) => c.includes(tenantCatVal) || c.includes(tenantCatLabel.toLowerCase())) ||
    eventCategoryKeys.includes(tenantCatVal);

  if (isExactCategory) {
    categoryScore = 98;
    categoryReason = `Kategori produk ${tenantCatLabel} selaras 100% dengan pameran ini.`;
  } else {
    // Cek apakah pameran memiliki zona khusus untuk kategori tenant
    const matchingZone = eventZones.find((z) => {
      const zName = z.name.toLowerCase();
      if (tenantCatVal === "fnb" && (zName.includes("f&b") || zName.includes("kuliner") || zName.includes("kafe") || zName.includes("makanan"))) return true;
      if (tenantCatVal === "fashion" && (zName.includes("fashion") || zName.includes("busana") || zName.includes("apparel"))) return true;
      if (tenantCatVal === "craft" && (zName.includes("craft") || zName.includes("kriya") || zName.includes("aksesoris"))) return true;
      if (tenantCatVal === "education" && (zName.includes("edukasi") || zName.includes("coding") || zName.includes("pendidikan"))) return true;
      return false;
    });

    if (matchingZone) {
      categoryScore = 88;
      categoryReason = `Pameran menyediakan zona khusus (${matchingZone.name}) yang sangat cocok untuk brand Anda.`;
    } else if (tenantCatVal === "fnb") {
      // F&B selalu memiliki kebutuhan pelengkap di pameran multi-hari
      categoryScore = 75;
      categoryReason = "Produk makanan & minuman selalu diminati sebagai pelengkap kebutuhan pengunjung pameran.";
    } else if (eventTitle.includes("artisan") || eventTitle.includes("market") || eventTitle.includes("expo")) {
      categoryScore = 65;
      categoryReason = "Pameran ini mengusung format pasar terbuka yang ramah untuk berbagai brand komersial.";
    }
  }

  // =========================================================================
  // PILAR 2: Tema & Keselarasan Nilai Keberlanjutan (Bobot 25%)
  // =========================================================================
  let sustainabilityScore = 55;
  let sustainabilityReason = "Pameran ini memiliki fokus umum tanpa spesialisasi tema nilai khusus.";

  const sustainabilityKeywords = [
    "ramah lingkungan", "eco", "green", "berkelanjutan", "sustainable",
    "daur ulang", "upcycling", "organik", "sirkular", "zero waste", "tekstil"
  ];
  const localArtisanKeywords = [
    "nusantara", "lokal", "artisan", "otentik", "kriya", "handmade",
    "etnik", "tradisional", "indonesia", "sabang", "merauke"
  ];
  const innovationKeywords = [
    "inovasi", "teknologi", "edutech", "robotika", "masa depan", "digital", "modern"
  ];

  const fullEventText = `${eventTitle} ${eventDesc} ${eventHighlights.join(" ")}`;
  const fullTenantText = `${tenantBrand} ${tenantDesc} ${tenantCatLabel.toLowerCase()}`;

  const hasEcoTenant = sustainabilityKeywords.some((k) => fullTenantText.includes(k));
  const hasEcoEvent = sustainabilityKeywords.some((k) => fullEventText.includes(k));

  const hasArtisanTenant = localArtisanKeywords.some((k) => fullTenantText.includes(k));
  const hasArtisanEvent = localArtisanKeywords.some((k) => fullEventText.includes(k));

  const hasTechEvent = innovationKeywords.some((k) => fullEventText.includes(k));
  const hasTechTenant = innovationKeywords.some((k) => fullTenantText.includes(k));

  if (hasEcoTenant && hasEcoEvent) {
    sustainabilityScore = 96;
    sustainabilityReason = "Nilai keberlanjutan & eco-friendly brand Anda selaras kuat dengan visi zero-waste pameran.";
  } else if (hasArtisanTenant && hasArtisanEvent) {
    sustainabilityScore = 93;
    sustainabilityReason = "Konsep produk lokal otentik nusantara brand Anda sejalan sempurna dengan semangat pameran.";
  } else if (hasTechTenant && hasTechEvent) {
    sustainabilityScore = 92;
    sustainabilityReason = "Fokus inovasi teknologi dan edukasi masa depan selaras dengan tema expo.";
  } else if (hasEcoEvent || hasArtisanEvent) {
    sustainabilityScore = 78;
    sustainabilityReason = "Tersedia sinergi konsep lokal dan keramahan lingkungan yang dapat diadopsi brand Anda.";
  } else {
    sustainabilityScore = 60;
    sustainabilityReason = "Tema pameran berorientasi komersial umum.";
  }

  // =========================================================================
  // PILAR 3: Ketersediaan Booth di Venue (Bobot 20%)
  // =========================================================================
  const boothsTotal = event.boothsTotal || eventMeta?.boothsTotal || 10;
  const boothsFilled = event.boothsFilled !== undefined ? event.boothsFilled : (eventMeta?.boothsFilled || 4);
  const availableBooths = event.booths !== undefined ? event.booths : Math.max(0, boothsTotal - boothsFilled);

  let boothScore = 50;
  let boothReason = "Ketersediaan booth sedang dipantau.";

  if (availableBooths >= 5) {
    boothScore = 95;
    boothReason = `Tersedia ${availableBooths} booth kosong dengan variasi ukuran dan posisi prima.`;
  } else if (availableBooths >= 2) {
    boothScore = 80;
    boothReason = `Tersisa ${availableBooths} booth kosong, tingkat okupansi venue sangat aktif.`;
  } else if (availableBooths === 1) {
    boothScore = 60;
    boothReason = "Slot booth tersisa sangat terbatas (hanya sisa 1 booth terakhir).";
  } else {
    boothScore = 20;
    boothReason = "Semua booth pada pameran ini telah dipesan penuh.";
  }

  // =========================================================================
  // PILAR 4: Potensi Sinergi Audiens & Traffic (Bobot 20%)
  // =========================================================================
  let trafficScore = 75;
  let trafficReason = "Venue memiliki daya jangkau pengunjung tingkat kota.";

  const tier1Venues = ["jakarta convention center", "jcc", "ice bsd", "jiexpo", "grand city"];
  const isTier1 = tier1Venues.some((v) => eventLocation.includes(v));

  if (isTier1) {
    trafficScore = 95;
    trafficReason = "Venue prestisius dengan estimasi traffic lebih dari 15.000 pengunjung potensial.";
  } else if (eventLocation.includes("creative hub") || eventLocation.includes("hall") || eventLocation.includes("mall")) {
    trafficScore = 88;
    trafficReason = "Lokasi strategis di pusat aktivitas komunitas kreatif berdaya beli tinggi.";
  } else {
    trafficScore = 80;
    trafficReason = "Akses lokasi mudah dijangkau dengan estimasi audiens yang stabil.";
  }

  // =========================================================================
  // TOTAL MULTI-CRITERIA SCORE (Bobot: 35% + 25% + 20% + 20% = 100%)
  // =========================================================================
  const weightedTotal = Math.round(
    categoryScore * 0.35 +
    sustainabilityScore * 0.25 +
    boothScore * 0.20 +
    trafficScore * 0.20
  );

  const overallScore = Math.min(99, Math.max(25, weightedTotal));
  const matchLevel: "high" | "medium" | "low" =
    overallScore >= 80 ? "high" : overallScore >= 60 ? "medium" : "low";

  const pillars: MatchPillar[] = [
    {
      id: "category",
      name: "Kategori & Industri",
      weight: 35,
      weightLabel: "Bobot 35%",
      score: categoryScore,
      color: "#10b981", // Emerald
      reason: categoryReason,
    },
    {
      id: "sustainability",
      name: "Tema & Keselarasan Nilai",
      weight: 25,
      weightLabel: "Bobot 25%",
      score: sustainabilityScore,
      color: "#34d399", // Mint Emerald
      reason: sustainabilityReason,
    },
    {
      id: "booth",
      name: "Ketersediaan Booth",
      weight: 20,
      weightLabel: "Bobot 20%",
      score: boothScore,
      color: "#61c5b4", // Teal
      reason: boothReason,
    },
    {
      id: "traffic",
      name: "Potensi Sinergi Audiens",
      weight: 20,
      weightLabel: "Bobot 20%",
      score: trafficScore,
      color: "#3b82f6", // Blue
      reason: trafficReason,
    },
  ];

  const highlights = [
    categoryReason,
    sustainabilityReason,
    trafficReason,
  ];

  return {
    categoryScore,
    sustainabilityScore,
    boothScore,
    trafficScore,
    overallScore,
    match: `${overallScore}%`,
    matchLevel,
    pillars,
    categoryReason,
    sustainabilityReason,
    boothReason,
    trafficReason,
    highlights,
  };
}
