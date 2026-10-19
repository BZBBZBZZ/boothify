export type FloorPlanBooth = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  sizeCm?: string;
  label: string;
  zone: string; // "fashion" | "fnb" | "craft" | "education" | "automotive" | "general"
  price: number;
  isBooked?: boolean;
};

export type EventZone = {
  value: string;
  label: string;
  color: string;
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
  menu?: Array<{ name: string; price: number; image?: string; description?: string }>;
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
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  category: string;
  categories?: string[];
  categoryKeys?: string[];
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

// Data kini tersimpan dan dikelola langsung di database Supabase (tabel public.events, public.booths, public.booth_tenants)
const createEventFallback = (id: string): EventDetail => ({
  id: String(id || "1"),
  title: "Pameran Boothify",
  date: "2026",
  location: "Convention Hall",
  category: "Pameran",
  description: "Data pameran terhubung langsung ke database Supabase.",
  organizer: "PT. Event Kreasi Nusantara",
  organizerEmail: "demo-organizer@boothify.id",
  boothsFilled: 0,
  boothsTotal: 10,
  priceRange: "Rp 2.000.000",
  image: "🎪",
  gradient: "from-primary/20 to-secondary/20",
  zones: [],
  highlights: [],
});

// Proxy fallback yang aman agar aplikasi tidak crash sebelum query database selesai
export const DEFAULT_EVENTS_META: Record<string, EventDetail> = new Proxy({}, {
  get: (target: Record<string, EventDetail>, prop: string) => {
    if (typeof prop === "string" && prop in target) return target[prop];
    return createEventFallback(typeof prop === "string" ? prop : "1");
  },
});

export const DEFAULT_EVENT_BOOTHS: Record<string, FloorPlanBooth[]> = {};
export const DEFAULT_EVENT_TENANTS: Record<string, Record<string, EventTenantInfo>> = {};

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
  const normalizeBooths = (items: FloorPlanBooth[]) => items.map((booth) => ({
    ...booth,
    sizeCm: booth.sizeCm || "300 x 300 cm",
  }));

  if (typeof window === "undefined") {
    return {
      booths: normalizeBooths(fallbackBooths),
      tenants: fallbackTenants,
      booked: Object.keys(fallbackTenants),
    };
  }

  try {
    // 1. Floor plan booths
    const storedBoothsRaw = localStorage.getItem(`boothify_event_${eventId}_booths`);
    let booths: FloorPlanBooth[];
    if (storedBoothsRaw) {
      booths = normalizeBooths(JSON.parse(storedBoothsRaw));
    } else {
      booths = normalizeBooths(fallbackBooths);
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

    // Booking records are the source of truth for who owns a booked booth.
    const storedBookings = JSON.parse(localStorage.getItem("boothify_tenant_bookings") || "[]");
    if (Array.isArray(storedBookings)) {
      storedBookings
        .filter((booking: { eventId?: string; booth?: string; tenantEmail?: string }) => String(booking.eventId) === String(eventId) && booking.booth && booking.tenantEmail)
        .forEach((booking: { booth: string; tenantEmail: string; tenantName?: string }) => {
          const current = tenants[booking.booth];
          if (current) {
            tenants[booking.booth] = {
              ...current,
              name: booking.tenantName || current.name,
              tenantEmail: booking.tenantEmail,
            };
          }
        });
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
      booths: normalizeBooths(fallbackBooths),
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
 * Get available events for Organizer management, filtered strictly by owner organizer
 */
export function getAllOrganizerEvents(organizerEmail?: string): Array<{ id: string; title: string; category: string; date: string }> {
  const isDemo = !organizerEmail || organizerEmail === "demo-organizer@boothify.id" || organizerEmail === "organizer@boothify.id";
  
  // Default events owned by the demo organizer (PT. Event Kreasi Nusantara)
  const demoEvents = [
    { id: "1", title: "Green Fashion Expo 2026", category: "Fashion", date: "15–17 Nov 2026" },
    { id: "2", title: "Indonesia Food Festival 2026", category: "F&B", date: "22–24 Nov 2026" },
    { id: "3", title: "EduTech Innovation Fair 2026", category: "Education", date: "1–3 Des 2026" },
  ];

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      if (Array.isArray(stored)) {
        if (isDemo) {
          // For demo organizer: show demo events + any events created by demo organizer
          const myCustom = stored
            .filter((e) => !e.organizerEmail || e.organizerEmail === "demo-organizer@boothify.id")
            .map((e) => ({
              id: String(e.id),
              title: e.title || `Event #${e.id}`,
              category: e.category || "General",
              date: e.date || "2026",
            }));
          const existingIds = new Set(myCustom.map((c) => c.id));
          const remDemo = demoEvents.filter((d) => !existingIds.has(d.id));
          return [...myCustom, ...remDemo];
        } else {
          // For newly registered organizer: ONLY show events created by this organizer
          const myEvents = stored
            .filter((e) => e.organizerEmail?.toLowerCase() === organizerEmail.toLowerCase())
            .map((e) => ({
              id: String(e.id),
              title: e.title || `Event #${e.id}`,
              category: e.category || "General",
              date: e.date || "2026",
            }));
          return myEvents;
        }
      }
    } catch { /* ignore */ }
  }

  return isDemo ? demoEvents : [];
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

