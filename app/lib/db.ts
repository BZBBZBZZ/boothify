/**
 * Every read and write the app makes to Supabase. Pages call these functions instead of
 * talking to tables directly, so the column names and security rules live in one place
 * (the matching tables, policies and functions are in supabase/schema.sql).
 */
import { supabase } from "./supabase";
import type {
  EventDetail,
  EventStatus,
  EventTenantInfo,
  EventZone,
  FloorPlanBooth,
  MediaFile,
  MenuItem,
  TenantBranding,
} from "./event-defaults";
import type { AdminCampaign, AlignmentBreakdown, CampaignApplication } from "./admin-campaigns";

/** A failed database call, with a message that can be shown to the user as is. */
export class DbError extends Error {}

type PgError = { message: string; code?: string } | null;

function friendly(error: NonNullable<PgError>, fallback: string): string {
  const text = error.message || "";
  if (/Failed to fetch|NetworkError|fetch failed/i.test(text)) {
    return "Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.";
  }
  if (error.code === "PGRST205" || /schema cache|does not exist/i.test(text)) {
    return "Database belum disiapkan. Jalankan supabase/schema.sql di Supabase SQL Editor.";
  }
  if (/row-level security|permission denied/i.test(text)) {
    return "Akun ini tidak punya izin untuk tindakan tersebut.";
  }
  if (error.code === "23505") return "Data yang sama sudah ada.";
  // Messages raised by our own database functions are already written for people
  if (error.code === "P0001") return text;
  return text || fallback;
}

function check(error: PgError, fallback: string): void {
  if (error) throw new DbError(friendly(error, fallback));
}

// ============================================================================
// Profiles
// ============================================================================

export type Role = "admin" | "organizer" | "tenant";

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  businessName?: string;
  businessCategory?: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
  logoUrl?: string;
  catalogType: "fnb" | "non-fnb";
  mediaFiles: MediaFile[];
  branding: Partial<TenantBranding>;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  business_name: string | null;
  business_category: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  catalog_type: "fnb" | "non-fnb";
  media_files: MediaFile[] | null;
  branding: Partial<TenantBranding> | null;
};

const mapProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
  businessName: r.business_name || undefined,
  businessCategory: r.business_category || undefined,
  phone: r.phone || undefined,
  description: r.description || undefined,
  website: r.website || undefined,
  instagram: r.instagram || undefined,
  logoUrl: r.logo_url || undefined,
  catalogType: r.catalog_type === "fnb" ? "fnb" : "non-fnb",
  mediaFiles: Array.isArray(r.media_files) ? r.media_files : [],
  branding: r.branding || {},
});

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  check(error, "Profil gagal dimuat.");
  return data ? mapProfile(data as ProfileRow) : null;
}

export type ProfilePatch = Partial<
  Pick<Profile, "name" | "businessName" | "businessCategory" | "phone" | "description" | "website" | "instagram" | "logoUrl" | "catalogType" | "mediaFiles" | "branding">
>;

export async function updateProfileRow(id: string, patch: ProfilePatch): Promise<Profile> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.businessName !== undefined) row.business_name = patch.businessName || null;
  if (patch.businessCategory !== undefined) row.business_category = patch.businessCategory || null;
  if (patch.phone !== undefined) row.phone = patch.phone || null;
  if (patch.description !== undefined) row.description = patch.description || null;
  if (patch.website !== undefined) row.website = patch.website || null;
  if (patch.instagram !== undefined) row.instagram = patch.instagram || null;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl || null;
  if (patch.catalogType !== undefined) row.catalog_type = patch.catalogType;
  if (patch.mediaFiles !== undefined) row.media_files = patch.mediaFiles;
  if (patch.branding !== undefined) row.branding = patch.branding;
  const { data, error } = await supabase.from("profiles").update(row).eq("id", id).select("*").single();
  check(error, "Profil gagal disimpan.");
  return mapProfile(data as ProfileRow);
}

// ============================================================================
// Events
// ============================================================================

type EventRow = {
  id: string;
  organizer_id: string;
  organizer: string;
  organizer_email: string | null;
  status: EventStatus;
  title: string;
  date: string;
  time: string | null;
  location: string;
  country: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  category: string;
  categories: string[] | null;
  description: string;
  theme: string | null;
  guidelines: string | null;
  price_range: string;
  image: string;
  highlights: string[] | null;
  floor_zones: EventZone[] | null;
  floor_objects: unknown[] | null;
  booths_total: number;
  booths_filled: number;
};

const mapEvent = (r: EventRow): EventDetail => ({
  id: r.id,
  title: r.title,
  date: r.date,
  time: r.time || undefined,
  location: r.location,
  country: r.country || undefined,
  province: r.province || undefined,
  city: r.city || undefined,
  address: r.address || undefined,
  category: r.category,
  categories: r.categories && r.categories.length > 0 ? r.categories : r.category ? [r.category] : [],
  description: r.description || "",
  organizer: r.organizer,
  organizerId: r.organizer_id,
  organizerEmail: r.organizer_email || undefined,
  boothsFilled: r.booths_filled || 0,
  boothsTotal: r.booths_total || 0,
  priceRange: r.price_range || "",
  image: r.image || "",
  status: r.status,
  theme: r.theme || undefined,
  guidelines: r.guidelines || undefined,
  highlights: r.highlights || [],
  floorZones: r.floor_zones,
  floorObjects: Array.isArray(r.floor_objects) ? r.floor_objects : [],
});

/** Published events, newest first. */
export async function listPublishedEvents(): Promise<EventDetail[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  check(error, "Daftar event gagal dimuat.");
  return (data as EventRow[]).map(mapEvent);
}

/** One event. Drafts are only returned to their own organizer. */
export async function getEvent(id: string): Promise<EventDetail | null> {
  if (!id) return null;
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  check(error, "Event gagal dimuat.");
  return data ? mapEvent(data as EventRow) : null;
}

/** Every event an organizer owns, drafts included. */
export async function listOrganizerEvents(organizerId: string): Promise<EventDetail[]> {
  if (!organizerId) return [];
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  check(error, "Event kamu gagal dimuat.");
  return (data as EventRow[]).map(mapEvent);
}

export type EventInput = {
  title: string;
  date: string;
  time?: string;
  location: string;
  country?: string;
  province?: string;
  city?: string;
  address?: string;
  category: string;
  categories: string[];
  description: string;
  theme?: string;
  guidelines?: string;
  image?: string;
  organizer: string;
  organizerEmail: string;
};

/** Create a draft event owned by the signed-in organizer and return its id. */
export async function createEvent(input: EventInput): Promise<string> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      date: input.date,
      time: input.time || null,
      location: input.location,
      country: input.country || "Indonesia",
      province: input.province || null,
      city: input.city || null,
      address: input.address || null,
      category: input.category,
      categories: input.categories,
      description: input.description,
      theme: input.theme || null,
      guidelines: input.guidelines || null,
      image: input.image || "",
      organizer: input.organizer,
      organizer_email: input.organizerEmail,
      status: "draft",
    })
    .select("id")
    .single();
  check(error, "Event gagal dibuat.");
  return (data as { id: string }).id;
}

export type EventPatch = Partial<
  Pick<EventDetail, "title" | "date" | "time" | "location" | "address" | "description" | "theme" | "guidelines" | "image" | "status">
>;

export async function updateEvent(id: string, patch: EventPatch): Promise<void> {
  const row: Record<string, unknown> = {};
  (["title", "date", "time", "location", "address", "description", "theme", "guidelines", "image", "status"] as const).forEach((key) => {
    if (patch[key] !== undefined) row[key] = patch[key];
  });
  const { data, error } = await supabase.from("events").update(row).eq("id", id).select("id");
  check(error, "Event gagal disimpan.");
  if (!data || data.length === 0) throw new DbError("Event tidak ditemukan atau bukan milik akun ini.");
}

// ============================================================================
// Floor plan & booths
// ============================================================================

type BoothRow = {
  id: string;
  label: string;
  zone: string;
  price: number | string;
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  rotation: number | string | null;
  size_cm: string | null;
  is_booked: boolean;
};

export async function getBooths(eventId: string): Promise<FloorPlanBooth[]> {
  const { data, error } = await supabase.from("booths").select("*").eq("event_id", eventId).order("label");
  check(error, "Denah booth gagal dimuat.");
  return (data as BoothRow[]).map((b) => ({
    id: b.label,
    label: b.label,
    zone: b.zone,
    price: Number(b.price) || 0,
    x: Number(b.x),
    y: Number(b.y),
    width: Number(b.width),
    height: Number(b.height),
    rotation: Number(b.rotation || 0),
    sizeCm: b.size_cm || undefined,
    isBooked: Boolean(b.is_booked),
  }));
}

/** Save the whole layout. Booked booths keep their tenant; publishing makes the event public. */
export async function saveFloorPlan(
  eventId: string,
  booths: FloorPlanBooth[],
  zones: EventZone[],
  objects: unknown[],
  publish: boolean
): Promise<void> {
  const payload = booths.map((b) => ({
    label: b.label,
    zone: b.zone,
    price: b.price,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    rotation: b.rotation || 0,
    sizeCm: b.sizeCm || "",
  }));
  const { error } = await supabase.rpc("save_floor_plan", {
    p_event_id: eventId,
    p_booths: payload,
    p_zones: zones,
    p_objects: objects,
    p_publish: publish,
  });
  check(error, "Denah gagal disimpan.");
}

type TenantViewRow = {
  booth_label: string;
  tenant_id: string;
  name: string;
  category: string | null;
  type: "fnb" | "non-fnb";
  description: string;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  logo_url: string | null;
  branding: Partial<TenantBranding> | null;
  media_files: MediaFile[] | null;
  menu: MenuItem[] | null;
  zone: string | null;
};

/** Tenants that rented a booth at this event, keyed by booth label. */
export async function getEventTenants(eventId: string): Promise<Record<string, EventTenantInfo>> {
  const { data, error } = await supabase.rpc("get_event_tenants", { p_event_id: eventId });
  check(error, "Daftar tenant gagal dimuat.");
  const result: Record<string, EventTenantInfo> = {};
  ((data as TenantViewRow[]) || []).forEach((row) => {
    const branding = row.branding || {};
    const hasBranding = Boolean(branding.headline || branding.tagline || branding.aboutText);
    result[row.booth_label] = {
      id: row.booth_label,
      tenantId: row.tenant_id,
      name: row.name,
      category: row.category || "",
      zone: row.zone || undefined,
      type: row.type === "fnb" ? "fnb" : "non-fnb",
      desc: row.description || "",
      website: row.website || undefined,
      instagram: row.instagram || undefined,
      phone: row.phone || undefined,
      mediaFiles: row.media_files || [],
      media: (row.media_files || []).map((m) => m.name),
      menu: row.menu || [],
      branding: hasBranding || row.logo_url
        ? {
            logo: branding.logo || row.logo_url || undefined,
            headline: branding.headline || row.name,
            tagline: branding.tagline || "",
            aboutText: branding.aboutText || row.description || "",
            primaryColor: branding.primaryColor || "#c2410c",
            instagram: branding.instagram || row.instagram || "",
            website: branding.website || row.website || "",
            whatsapp: branding.whatsapp || row.phone || "",
            highlights: branding.highlights,
          }
        : undefined,
    };
  });
  return result;
}

// ============================================================================
// Bookings & tenant menus
// ============================================================================

export type Booking = {
  id: string;
  eventId: string;
  event: string;
  date: string;
  booth: string;
  zone?: string;
  price: number;
  tax: number;
  serviceFee: number;
  total: number;
  isFreeTax: boolean;
  status: "confirmed" | "cancelled";
  payment: "paid" | "unpaid";
  paymentMethod?: string;
  tenantId: string;
  tenantName: string;
  createdAt: string;
};

type BookingRow = {
  id: string;
  event_id: string;
  booth_label: string;
  tenant_id: string;
  tenant_name: string;
  event_title: string;
  event_date: string;
  zone: string | null;
  price: number | string;
  tax: number | string;
  service_fee: number | string;
  is_free_tax: boolean;
  payment_method: string | null;
  status: "confirmed" | "cancelled";
  payment: "paid" | "unpaid";
  created_at: string;
};

const mapBooking = (b: BookingRow): Booking => {
  const price = Number(b.price) || 0;
  const tax = Number(b.tax) || 0;
  const serviceFee = Number(b.service_fee) || 0;
  return {
    id: b.id,
    eventId: b.event_id,
    event: b.event_title,
    date: b.event_date,
    booth: b.booth_label,
    zone: b.zone || undefined,
    price,
    tax,
    serviceFee,
    total: price + tax + serviceFee,
    isFreeTax: b.is_free_tax,
    status: b.status,
    payment: b.payment,
    paymentMethod: b.payment_method || undefined,
    tenantId: b.tenant_id,
    tenantName: b.tenant_name,
    createdAt: b.created_at,
  };
};

/** Rent booths for the signed-in tenant. Availability and prices are checked by the database. */
export async function bookBooths(eventId: string, labels: string[], paymentMethod: string): Promise<Booking[]> {
  const { data, error } = await supabase.rpc("book_booths", {
    p_event_id: eventId,
    p_labels: labels,
    p_payment_method: paymentMethod,
  });
  check(error, "Pembayaran gagal diproses.");
  return ((data as BookingRow[]) || []).map(mapBooking);
}

export async function listTenantBookings(tenantId: string): Promise<Booking[]> {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });
  check(error, "Booking gagal dimuat.");
  return (data as BookingRow[]).map(mapBooking);
}

export async function listBookingsForEvents(eventIds: string[]): Promise<Booking[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("event_id", eventIds)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });
  check(error, "Booking gagal dimuat.");
  return (data as BookingRow[]).map(mapBooking);
}

export async function getTenantMenu(tenantId: string, eventId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("tenant_menus")
    .select("menu")
    .eq("tenant_id", tenantId)
    .eq("event_id", eventId)
    .maybeSingle();
  check(error, "Menu gagal dimuat.");
  return Array.isArray(data?.menu) ? (data.menu as MenuItem[]) : [];
}

export async function saveTenantMenu(tenantId: string, eventId: string, menu: MenuItem[]): Promise<void> {
  const { error } = await supabase
    .from("tenant_menus")
    .upsert({ tenant_id: tenantId, event_id: eventId, menu, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,event_id" });
  check(error, "Menu gagal disimpan.");
}

// ============================================================================
// Campaigns & curation
// ============================================================================

type CampaignRow = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  theme: string;
  target_categories: string[] | null;
  alignment_criteria: string[] | null;
  start_date: string;
  end_date: string;
  status: "active" | "draft" | "closed";
  banner_gradient: string | null;
  benefits: AdminCampaign["benefits"] | null;
  max_participants: number;
  created_at: string;
};

const mapCampaign = (r: CampaignRow): AdminCampaign => ({
  id: r.id,
  title: r.title,
  tagline: r.tagline,
  description: r.description,
  theme: r.theme,
  targetCategories: r.target_categories || [],
  alignmentCriteria: r.alignment_criteria || [],
  startDate: r.start_date,
  endDate: r.end_date,
  status: r.status,
  bannerGradient: r.banner_gradient || "",
  benefits: {
    freeTax: r.benefits?.freeTax ?? true,
    highlightBadge: r.benefits?.highlightBadge || "Official Campaign",
    priorityListing: r.benefits?.priorityListing ?? true,
    description: r.benefits?.description || "",
  },
  maxParticipants: r.max_participants,
  createdAt: r.created_at,
});

export async function listCampaigns(): Promise<AdminCampaign[]> {
  const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  check(error, "Campaign gagal dimuat.");
  return (data as CampaignRow[]).map(mapCampaign);
}

export async function createCampaign(c: Omit<AdminCampaign, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("campaigns").insert({
    title: c.title,
    tagline: c.tagline,
    description: c.description,
    theme: c.theme,
    target_categories: c.targetCategories,
    alignment_criteria: c.alignmentCriteria,
    start_date: c.startDate,
    end_date: c.endDate,
    status: c.status,
    banner_gradient: c.bannerGradient,
    benefits: c.benefits,
    max_participants: c.maxParticipants || 10,
  });
  check(error, "Campaign gagal dibuat.");
}

export async function updateCampaignStatus(id: string, status: AdminCampaign["status"]): Promise<void> {
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
  check(error, "Status campaign gagal diubah.");
}

type ApplicationRow = {
  id: string;
  campaign_id: string;
  campaign_title: string;
  event_id: string;
  event_title: string;
  event_category: string | null;
  event_location: string | null;
  event_date: string | null;
  organizer_email: string;
  organizer_name: string;
  submission_pitch: string;
  alignment_score: number;
  alignment_breakdown: AlignmentBreakdown | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const mapApplication = (r: ApplicationRow): CampaignApplication => ({
  id: r.id,
  campaignId: r.campaign_id,
  campaignTitle: r.campaign_title,
  eventId: r.event_id,
  eventTitle: r.event_title,
  eventCategory: r.event_category || "",
  eventLocation: r.event_location || "",
  eventDate: r.event_date || "",
  organizerEmail: r.organizer_email,
  organizerName: r.organizer_name,
  submissionPitch: r.submission_pitch,
  alignmentScore: r.alignment_score,
  alignmentBreakdown: r.alignment_breakdown || { categoryMatch: 0, themeMatch: 0, scaleMatch: 0 },
  status: r.status,
  adminNotes: r.admin_notes || undefined,
  reviewedAt: r.reviewed_at || undefined,
  createdAt: r.created_at,
});

/** Applications the signed-in account may see: its own, every approved one, or all for an admin. */
export async function listApplications(): Promise<CampaignApplication[]> {
  const { data, error } = await supabase.from("campaign_applications").select("*").order("created_at", { ascending: false });
  check(error, "Pengajuan gagal dimuat.");
  return (data as ApplicationRow[]).map(mapApplication);
}

export async function submitApplication(
  app: Omit<CampaignApplication, "id" | "status" | "createdAt" | "adminNotes" | "reviewedAt">
): Promise<void> {
  const { error } = await supabase.from("campaign_applications").insert({
    campaign_id: app.campaignId,
    campaign_title: app.campaignTitle,
    event_id: app.eventId,
    event_title: app.eventTitle,
    event_category: app.eventCategory,
    event_location: app.eventLocation,
    event_date: app.eventDate,
    organizer_email: app.organizerEmail,
    organizer_name: app.organizerName,
    submission_pitch: app.submissionPitch,
    alignment_score: app.alignmentScore,
    alignment_breakdown: app.alignmentBreakdown,
    status: "pending",
  });
  if (error?.code === "23505") throw new DbError("Event ini sudah pernah diajukan ke campaign tersebut.");
  check(error, "Pengajuan gagal dikirim.");
}

export async function reviewApplication(id: string, status: "approved" | "rejected", adminNotes: string): Promise<void> {
  const { error } = await supabase
    .from("campaign_applications")
    .update({ status, admin_notes: adminNotes, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  check(error, "Peninjauan gagal disimpan.");
}

/** Approved campaign per event id, for highlighting events and waiving tax. */
export async function approvedCampaignsByEvent(): Promise<Record<string, AdminCampaign>> {
  const [apps, campaigns] = await Promise.all([
    supabase.from("campaign_applications").select("event_id, campaign_id").eq("status", "approved"),
    supabase.from("campaigns").select("*"),
  ]);
  check(apps.error, "Campaign gagal dimuat.");
  check(campaigns.error, "Campaign gagal dimuat.");
  const byId = new Map((campaigns.data as CampaignRow[]).map((c) => [c.id, mapCampaign(c)]));
  const result: Record<string, AdminCampaign> = {};
  (apps.data as Array<{ event_id: string; campaign_id: string }>).forEach((a) => {
    const camp = byId.get(a.campaign_id);
    if (camp && camp.status !== "draft") result[a.event_id] = camp;
  });
  return result;
}

export async function getEventCampaign(eventId: string): Promise<AdminCampaign | null> {
  const all = await approvedCampaignsByEvent();
  return all[eventId] || null;
}

// ============================================================================
// Visitor orders
// ============================================================================

export type OrderStatus = "pending" | "making" | "ready" | "done" | "cancelled";

export type VisitorOrder = {
  id: string;
  eventId: string;
  event: string;
  booth: string;
  items: Array<{ boothId?: string; name: string; qty: number; price: number }>;
  total: number;
  customer: string;
  phone?: string;
  method: string;
  status: OrderStatus;
  tenantName?: string;
  createdAt: string;
};

type OrderRow = {
  id: string;
  event_id: string;
  event_title: string;
  booth: string;
  items: VisitorOrder["items"] | null;
  total: number | string;
  customer_name: string;
  customer_phone: string | null;
  payment_method: string;
  status: OrderStatus;
  tenant_name: string | null;
  created_at: string;
};

const mapOrder = (o: OrderRow): VisitorOrder => ({
  id: o.id,
  eventId: o.event_id,
  event: o.event_title,
  booth: o.booth,
  items: o.items || [],
  total: Number(o.total) || 0,
  customer: o.customer_name,
  phone: o.customer_phone || undefined,
  method: o.payment_method,
  status: o.status,
  tenantName: o.tenant_name || undefined,
  createdAt: o.created_at,
});

export async function placeOrder(input: {
  eventId: string;
  booth: string;
  items: Array<{ name: string; qty: number }>;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("place_visitor_order", {
    p_event_id: input.eventId,
    p_booth: input.booth,
    p_items: input.items,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_payment_method: input.paymentMethod,
  });
  check(error, "Pesanan gagal dibuat.");
  return String(data);
}

/** A visitor's own order, looked up by its order code. */
export async function getOrder(id: string): Promise<{ id: string; booth: string; items: VisitorOrder["items"]; total: number; status: OrderStatus; tenantName?: string } | null> {
  const { data, error } = await supabase.rpc("get_visitor_order", { p_id: id });
  check(error, "Status pesanan gagal dimuat.");
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    id: row.id,
    booth: row.booth,
    items: row.items || [],
    total: Number(row.total) || 0,
    status: row.status,
    tenantName: row.tenant_name || undefined,
  };
}

export async function listTenantOrders(tenantId: string): Promise<VisitorOrder[]> {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("visitor_orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  check(error, "Pesanan gagal dimuat.");
  return (data as OrderRow[]).map(mapOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("visitor_orders").update({ status }).eq("id", id);
  check(error, "Status pesanan gagal diubah.");
}

// ============================================================================
// Messages to organizers
// ============================================================================

export type InboxMessage = {
  id: string;
  eventId?: string;
  eventTitle: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
};

export async function sendOrganizerMessage(input: {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.rpc("send_organizer_message", {
    p_event_id: input.eventId,
    p_sender_name: input.name,
    p_sender_email: input.email,
    p_sender_phone: input.phone,
    p_message: input.message,
  });
  check(error, "Pesan gagal dikirim.");
}

export async function listOrganizerMessages(organizerId: string): Promise<InboxMessage[]> {
  if (!organizerId) return [];
  const { data, error } = await supabase
    .from("organizer_messages")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("created_at", { ascending: false });
  check(error, "Pesan gagal dimuat.");
  return (data as Array<Record<string, string | null>>).map((m) => ({
    id: String(m.id),
    eventId: m.event_id || undefined,
    eventTitle: m.event_title || "",
    senderName: m.sender_name || "",
    senderEmail: m.sender_email || "",
    senderPhone: m.sender_phone || "",
    message: m.message || "",
    status: (m.status as InboxMessage["status"]) || "unread",
    createdAt: m.created_at || "",
  }));
}

export async function setMessageStatus(id: string, status: InboxMessage["status"]): Promise<void> {
  const { error } = await supabase.from("organizer_messages").update({ status }).eq("id", id);
  check(error, "Pesan gagal diperbarui.");
}

export async function deleteOrganizerMessage(id: string): Promise<void> {
  const { error } = await supabase.from("organizer_messages").delete().eq("id", id);
  check(error, "Pesan gagal dihapus.");
}

// ============================================================================
// File storage
// ============================================================================

const BUCKET = "uploads";

/** Upload a file into the signed-in user's folder and return its public link. */
export async function uploadToStorage(userId: string, file: Blob, fileName: string, folder: string): Promise<string> {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  const path = `${userId}/${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    const text = error.message || "";
    if (/bucket not found/i.test(text)) throw new DbError("Penyimpanan file belum disiapkan. Jalankan supabase/schema.sql di Supabase.");
    if (/exceeded|too large|payload/i.test(text)) throw new DbError("File terlalu besar. Maksimal 20 MB.");
    throw new DbError("File gagal diunggah. " + text);
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Turn any thrown value into a message for the user. */
export function errorMessage(err: unknown, fallback = "Terjadi kesalahan. Coba lagi."): string {
  if (err instanceof DbError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
