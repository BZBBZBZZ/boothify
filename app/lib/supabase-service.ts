import { supabase } from "./supabase";
import type { EventDetail, FloorPlanBooth, EventTenantInfo } from "./event-defaults";
import type { AdminCampaign, CampaignApplication } from "./admin-campaigns";

// ============================================================================
// 1. SERVICE: EVENTS & FLOOR PLANS
// ============================================================================

export async function getEventsFromSupabase(): Promise<EventDetail[]> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Supabase getEvents warning:", error?.message);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time || undefined,
      location: row.location,
      country: row.country || "Indonesia",
      province: row.province || undefined,
      city: row.city || undefined,
      address: row.address || undefined,
      category: row.category,
      categories: row.categories || [],
      description: row.description || "",
      organizer: row.organizer,
      organizerEmail: row.organizer_email || undefined,
      boothsFilled: row.booths_filled || 0,
      boothsTotal: row.booths_total || 0,
      priceRange: row.price_range || "",
      image: row.image || "🎪",
      gradient: row.gradient || "from-primary/20 to-secondary/20",
      zones: row.zones || [],
      highlights: row.highlights || [],
    }));
  } catch (err) {
    console.error("Failed to fetch events from Supabase:", err);
    return [];
  }
}

export async function getEventByIdFromSupabase(eventId: string): Promise<EventDetail | null> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      date: data.date,
      time: data.time || undefined,
      location: data.location,
      country: data.country || "Indonesia",
      province: data.province || undefined,
      city: data.city || undefined,
      address: data.address || undefined,
      category: data.category,
      categories: data.categories || [],
      description: data.description || "",
      organizer: data.organizer,
      organizerEmail: data.organizer_email || undefined,
      boothsFilled: data.booths_filled || 0,
      boothsTotal: data.booths_total || 0,
      priceRange: data.price_range || "",
      image: data.image || "🎪",
      gradient: data.gradient || "from-primary/20 to-secondary/20",
      zones: data.zones || [],
      highlights: data.highlights || [],
    };
  } catch (err) {
    console.error("Failed to get event by ID:", err);
    return null;
  }
}

export async function saveEventToSupabase(
  event: Partial<EventDetail> & { id: string; title: string }
): Promise<boolean> {
  try {
    const payload = {
      id: String(event.id),
      title: event.title || "Event Baru",
      date: event.date || "Akan Datang",
      time: event.time || null,
      location: event.location || "Venue Acara",
      country: event.country || "Indonesia",
      province: event.province || null,
      city: event.city || null,
      address: event.address || null,
      category: event.category || "Umum",
      categories: event.categories || [],
      description: event.description || "",
      organizer: event.organizer || "PT. Event Kreasi Nusantara",
      organizer_email: event.organizerEmail || "demo-organizer@boothify.id",
      booths_filled: event.boothsFilled || 0,
      booths_total: event.boothsTotal || 30,
      price_range: event.priceRange || "Rp 2.000.000 – Rp 4.500.000",
      image: event.image || "🎪",
      gradient: event.gradient || "from-emerald-500/20 to-teal-500/20",
      zones: event.zones || [],
      highlights: event.highlights || [],
    };

    const { error } = await supabase.from("events").upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase saveEvent error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to save event to Supabase:", err);
    return false;
  }
}

export async function saveFloorPlanBoothsToSupabase(
  eventId: string,
  booths: FloorPlanBooth[]
): Promise<boolean> {
  try {
    if (!booths || booths.length === 0) return true;

    const records = booths.map((b) => ({
      id: `${eventId}_${b.label || b.id}`,
      event_id: String(eventId),
      label: b.label || b.id,
      zone: b.zone || "general",
      price: Number(b.price) || 2000000,
      x: Number(b.x),
      y: Number(b.y),
      width: Number(b.width),
      height: Number(b.height),
      rotation: Number(b.rotation || 0),
      size_cm: b.sizeCm || "300 x 300 cm",
      is_booked: false,
    }));

    const { error } = await supabase.from("booths").upsert(records, { onConflict: "id" });
    if (error) {
      console.warn("Supabase saveBooths error:", error.message);
      return false;
    }

    // Update booths_total di tabel events Supabase
    await supabase.from("events").update({ booths_total: booths.length }).eq("id", String(eventId));
    return true;
  } catch (err) {
    console.error("Failed to save booths to Supabase:", err);
    return false;
  }
}

export async function getBoothsByEventFromSupabase(eventId: string): Promise<FloorPlanBooth[]> {
  try {
    const { data, error } = await supabase
      .from("booths")
      .select("*")
      .eq("event_id", eventId);

    if (error || !data) return [];

    return data.map((b) => ({
      id: b.label || b.id,
      x: Number(b.x),
      y: Number(b.y),
      width: Number(b.width),
      height: Number(b.height),
      rotation: Number(b.rotation || 0),
      sizeCm: b.size_cm || undefined,
      label: b.label,
      zone: b.zone,
      price: Number(b.price),
      isBooked: Boolean(b.is_booked),
    }));
  } catch (err) {
    console.error("Failed to fetch booths:", err);
    return [];
  }
}

export async function getTenantsByEventFromSupabase(
  eventId: string
): Promise<Record<string, EventTenantInfo>> {
  try {
    const { data, error } = await supabase
      .from("booth_tenants")
      .select("*")
      .eq("event_id", eventId);

    if (error || !data) return {};

    const result: Record<string, EventTenantInfo> = {};
    data.forEach((row) => {
      const label = row.booth_label;
      result[label] = {
        id: label,
        name: row.name,
        category: row.category,
        zone: row.zone || undefined,
        type: row.type as "fnb" | "non-fnb",
        desc: row.description || "",
        tenantEmail: row.tenant_email || undefined,
        website: row.website || undefined,
        media: row.media || [],
        menu: row.menu || [],
        branding: row.branding || undefined,
      };
    });
    return result;
  } catch (err) {
    console.error("Failed to fetch tenants:", err);
    return {};
  }
}

// ============================================================================
// 2. SERVICE: CAMPAIGNS & APPLICATIONS
// ============================================================================

export async function getAdminCampaignsFromSupabase(): Promise<AdminCampaign[]> {
  try {
    const { data, error } = await supabase
      .from("admin_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      tagline: row.tagline,
      description: row.description,
      theme: row.theme,
      targetCategories: row.target_categories || [],
      alignmentCriteria: row.alignment_criteria || [],
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status as "active" | "draft" | "closed",
      bannerGradient: row.banner_gradient || "from-amber-500/20 to-purple-500/20",
      icon: row.icon || "🏆",
      benefits: row.benefits || {
        freeTax: true,
        highlightBadge: "🌟 Official Campaign",
        priorityListing: true,
        description: "Bebas Pajak & Lencana Sorotan",
      },
      maxParticipants: row.max_participants || 10,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch admin campaigns:", err);
    return [];
  }
}

export async function getCampaignApplicationsFromSupabase(): Promise<CampaignApplication[]> {
  try {
    const { data, error } = await supabase
      .from("campaign_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      campaignId: row.campaign_id,
      campaignTitle: row.campaign_title,
      eventId: row.event_id,
      eventTitle: row.event_title,
      eventCategory: row.event_category || "",
      eventLocation: row.event_location || "",
      eventDate: row.event_date || "",
      organizerEmail: row.organizer_email,
      organizerName: row.organizer_name,
      submissionPitch: row.submission_pitch,
      alignmentScore: row.alignment_score || 80,
      alignmentBreakdown: row.alignment_breakdown || {
        categoryMatch: 80,
        themeMatch: 80,
        scaleMatch: 80,
      },
      status: row.status as "pending" | "approved" | "rejected",
      adminNotes: row.admin_notes || undefined,
      reviewedAt: row.reviewed_at || undefined,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch applications:", err);
    return [];
  }
}

export async function submitCampaignApplicationToSupabase(
  app: CampaignApplication
): Promise<boolean> {
  try {
    const { error } = await supabase.from("campaign_applications").insert([
      {
        id: app.id,
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
        status: app.status,
      },
    ]);

    if (error) {
      console.error("Error inserting campaign application:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to submit application to Supabase:", err);
    return false;
  }
}

export async function reviewCampaignApplicationInSupabase(
  applicationId: string,
  status: "approved" | "rejected",
  adminNotes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("campaign_applications")
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      console.error("Error updating application status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to review application:", err);
    return false;
  }
}

// ============================================================================
// 3. SERVICE: BOOKINGS & ORDERS
// ============================================================================

export async function getTenantBookingsFromSupabase(tenantEmail?: string) {
  try {
    let query = supabase.from("tenant_bookings").select("*").order("created_at", { ascending: false });
    if (tenantEmail) {
      query = query.eq("tenant_email", tenantEmail);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((b) => ({
      id: b.id,
      event: b.event_title,
      eventId: b.event_id,
      booth: b.booth,
      tenantEmail: b.tenant_email,
      tenantName: b.tenant_name,
      amount: b.amount,
      status: b.status,
      payment: b.payment,
      isFreeTax: b.is_free_tax,
      date: b.date,
      createdAt: b.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch tenant bookings:", err);
    return [];
  }
}

export async function getVisitorOrdersFromSupabase(tenantEmail?: string) {
  try {
    let query = supabase.from("visitor_orders").select("*").order("created_at", { ascending: false });
    if (tenantEmail) {
      query = query.eq("tenant_email", tenantEmail);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((o) => ({
      id: o.id,
      eventId: o.event_id,
      event: o.event_title,
      booth: o.booth,
      items: o.items || [],
      total: Number(o.total),
      customer: o.customer_name,
      phone: o.customer_phone,
      method: o.payment_method,
      status: o.status,
      tenantEmail: o.tenant_email,
      tenantName: o.tenant_name,
      createdAt: o.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch visitor orders:", err);
    return [];
  }
}

export async function getOrganizerMessagesFromSupabase(organizerEmail?: string) {
  try {
    let query = supabase.from("organizer_messages").select("*").order("created_at", { ascending: false });
    if (organizerEmail) {
      query = query.eq("organizer_email", organizerEmail);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((m) => ({
      id: m.id,
      eventId: m.event_id,
      eventTitle: m.event_title,
      organizerEmail: m.organizer_email,
      senderName: m.sender_name,
      senderEmail: m.sender_email,
      senderPhone: m.sender_phone,
      message: m.message,
      status: m.status,
      createdAt: m.created_at,
    }));
  } catch (err) {
    console.error("Failed to fetch organizer messages:", err);
    return [];
  }
}

export async function updateOrganizerMessageStatusInSupabase(id: string, status: "read" | "unread" | "replied") {
  try {
    await supabase.from("organizer_messages").update({ status }).eq("id", id);
  } catch (err) {
    console.error("Failed to update message status:", err);
  }
}

export async function deleteOrganizerMessageInSupabase(id: string) {
  try {
    await supabase.from("organizer_messages").delete().eq("id", id);
  } catch (err) {
    console.error("Failed to delete message:", err);
  }
}

export const getBoothsFromSupabase = getBoothsByEventFromSupabase;
export const getTenantsFromSupabase = getTenantsByEventFromSupabase;
