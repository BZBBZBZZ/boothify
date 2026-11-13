/**
 * Shared types for events, floor plans and booth tenants. All of this data lives in
 * Supabase (see app/lib/db.ts); nothing here holds sample or default records.
 */

export type FloorPlanBooth = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  sizeCm?: string;
  label: string;
  zone: string;
  price: number;
  isBooked?: boolean;
};

export type EventZone = {
  value: string;
  label: string;
  color: string;
};

export type MenuItem = {
  id?: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  stock?: number;
};

export type MediaFile = { id?: string; name: string; type: string; url?: string; description?: string };

export type TenantBranding = {
  logo?: string;
  headline: string;
  tagline: string;
  aboutText: string;
  primaryColor: string;
  instagram: string;
  website: string;
  whatsapp?: string;
  highlights?: string[];
};

export type EventTenantInfo = {
  id: string; // Booth label, e.g. "A1"
  tenantId?: string;
  name: string; // Brand name
  category: string;
  zone?: string;
  type: "fnb" | "non-fnb";
  desc: string;
  website?: string;
  instagram?: string;
  phone?: string;
  media?: string[];
  /** Uploaded brochures, photos and videos that can be opened from the visitor guide. */
  mediaFiles?: MediaFile[];
  menu?: MenuItem[];
  branding?: TenantBranding;
};

export type EventStatus = "draft" | "published";

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
  organizerId?: string;
  organizerEmail?: string;
  boothsFilled: number;
  boothsTotal: number;
  priceRange: string;
  image: string;
  status?: EventStatus;
  theme?: string;
  guidelines?: string;
  gradient?: string;
  zones?: Array<{ name: string; booths: number; color: string }>;
  highlights?: string[];
  floorZones?: EventZone[] | null;
  floorObjects?: unknown[];
};

const ACTIVE_EVENT_KEY = "boothify_active_organizer_event_id";

/** The event an organizer last worked on, remembered on this device as a convenience. */
export function getActiveOrganizerEventId(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(ACTIVE_EVENT_KEY) || "";
  } catch {
    return "";
  }
}

export function setActiveOrganizerEventId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_EVENT_KEY, id);
  } catch {
    /* storage unavailable: nothing to remember */
  }
}
