export interface AdminCampaign {
  id: string;
  title: string;
  tagline: string;
  description: string;
  theme: string;
  targetCategories: string[];
  alignmentCriteria: string[];
  startDate: string;
  endDate: string;
  status: "active" | "draft" | "closed";
  bannerGradient: string;
  icon: string;
  benefits: {
    freeTax: boolean;
    highlightBadge: string;
    priorityListing: boolean;
    description: string;
  };
  maxParticipants?: number;
  createdAt: string;
}

export interface AlignmentBreakdown {
  categoryMatch: number;
  themeMatch: number;
  scaleMatch: number;
}

export interface CampaignApplication {
  id: string;
  campaignId: string;
  campaignTitle: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  eventLocation: string;
  eventDate: string;
  organizerEmail: string;
  organizerName: string;
  submissionPitch: string;
  alignmentScore: number;
  alignmentBreakdown: AlignmentBreakdown;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

import { supabase } from "./supabase";

// Data kini disimpan dan diambil langsung dari database Supabase (tabel public.admin_campaigns & public.campaign_applications)
export const DEFAULT_CAMPAIGNS: AdminCampaign[] = [];
export const DEFAULT_APPLICATIONS: CampaignApplication[] = [];

const CAMPAIGNS_STORAGE_KEY = "boothify_admin_campaigns";
const APPLICATIONS_STORAGE_KEY = "boothify_campaign_applications";

export function getAdminCampaigns(): AdminCampaign[] {
  if (typeof window === "undefined") return DEFAULT_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  // Asynchronously sync from Supabase if available
  supabase
    .from("admin_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .then(({ data }) => {
      if (data && data.length > 0) {
        const mapped: AdminCampaign[] = data.map((row) => ({
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
          icon: row.icon || "🛍️",
          benefits: row.benefits || {
            freeTax: true,
            highlightBadge: "🌟 Official Admin Campaign",
            priorityListing: true,
            description: "Bebas Pajak (PPN 0%)",
          },
          maxParticipants: row.max_participants || 10,
          createdAt: row.created_at,
        }));
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(mapped));
      }
    });

  return DEFAULT_CAMPAIGNS;
}

export function saveAdminCampaigns(campaigns: AdminCampaign[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
}

export function createAdminCampaign(data: Omit<AdminCampaign, "id" | "createdAt">): AdminCampaign {
  const campaigns = getAdminCampaigns();
  const newCampaign: AdminCampaign = {
    ...data,
    id: `camp_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newCampaign, ...campaigns];
  saveAdminCampaigns(updated);

  // Sync to Supabase in background
  supabase.from("admin_campaigns").insert([
    {
      id: newCampaign.id,
      title: newCampaign.title,
      tagline: newCampaign.tagline,
      description: newCampaign.description,
      theme: newCampaign.theme,
      target_categories: newCampaign.targetCategories,
      alignment_criteria: newCampaign.alignmentCriteria,
      start_date: newCampaign.startDate,
      end_date: newCampaign.endDate,
      status: newCampaign.status,
      banner_gradient: newCampaign.bannerGradient,
      icon: newCampaign.icon,
      benefits: newCampaign.benefits,
      max_participants: newCampaign.maxParticipants,
    },
  ]).then(({ error }) => {
    if (error) console.warn("Supabase createAdminCampaign error:", error.message);
  });

  return newCampaign;
}

export function updateAdminCampaign(id: string, data: Partial<AdminCampaign>): AdminCampaign | null {
  const campaigns = getAdminCampaigns();
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  campaigns[idx] = { ...campaigns[idx], ...data };
  saveAdminCampaigns(campaigns);

  // Sync to Supabase in background
  supabase.from("admin_campaigns").update(data).eq("id", id).then(({ error }) => {
    if (error) console.warn("Supabase updateAdminCampaign error:", error.message);
  });

  return campaigns[idx];
}

export function getCampaignApplications(): CampaignApplication[] {
  if (typeof window === "undefined") return DEFAULT_APPLICATIONS;
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  // Asynchronously sync from Supabase if available
  supabase
    .from("campaign_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .then(({ data }) => {
      if (data && data.length > 0) {
        const mapped: CampaignApplication[] = data.map((row) => ({
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
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(mapped));
      }
    });

  return DEFAULT_APPLICATIONS;
}

export function saveCampaignApplications(apps: CampaignApplication[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
}

export function calculateAlignmentScore(
  campaign: AdminCampaign,
  event: { category?: string; title?: string; description?: string }
): { score: number; breakdown: AlignmentBreakdown } {
  const eventCat = (event.category || "").toLowerCase();
  const eventText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
  const campaignCats = campaign.targetCategories.map((c) => c.toLowerCase());

  // 1. Category match (0 - 100)
  let categoryMatch = 50;
  if (campaignCats.some((c) => eventCat.includes(c) || c.includes(eventCat))) {
    categoryMatch = 95;
  } else if (campaignCats.includes("multi-industri") || campaignCats.includes("umum")) {
    categoryMatch = 80;
  }

  // 2. Theme & keywords match (0 - 100)
  let themeMatch = 60;
  const keywords = ["lokal", "kreatif", "fashion", "kuliner", "kriya", "eco", "ramah lingkungan", "artisan", "umkm", "hijau", "sustainability"];
  const matches = keywords.filter((k) => eventText.includes(k)).length;
  if (matches >= 3) themeMatch = 95;
  else if (matches >= 2) themeMatch = 85;
  else if (matches >= 1) themeMatch = 75;

  // 3. Quality & scale match
  const scaleMatch = 85;

  const score = Math.round(categoryMatch * 0.45 + themeMatch * 0.35 + scaleMatch * 0.2);

  return {
    score: Math.min(100, Math.max(30, score)),
    breakdown: {
      categoryMatch,
      themeMatch,
      scaleMatch,
    },
  };
}

export function submitCampaignApplication(
  data: Omit<CampaignApplication, "id" | "status" | "createdAt" | "alignmentScore" | "alignmentBreakdown">
): CampaignApplication {
  const apps = getCampaignApplications();
  const campaigns = getAdminCampaigns();
  const campaign = campaigns.find((c) => c.id === data.campaignId) || campaigns[0];

  const { score, breakdown } = calculateAlignmentScore(campaign, {
    category: data.eventCategory,
    title: data.eventTitle,
    description: data.submissionPitch,
  });

  const newApp: CampaignApplication = {
    ...data,
    id: `app_${Date.now()}`,
    status: "pending",
    alignmentScore: score,
    alignmentBreakdown: breakdown,
    createdAt: new Date().toISOString(),
  };

  const updated = [newApp, ...apps];
  saveCampaignApplications(updated);

  // Sync to Supabase in background
  supabase
    .from("campaign_applications")
    .insert([
      {
        id: newApp.id,
        campaign_id: newApp.campaignId,
        campaign_title: newApp.campaignTitle,
        event_id: newApp.eventId,
        event_title: newApp.eventTitle,
        event_category: newApp.eventCategory,
        event_location: newApp.eventLocation,
        event_date: newApp.eventDate,
        organizer_email: newApp.organizerEmail,
        organizer_name: newApp.organizerName,
        submission_pitch: newApp.submissionPitch,
        alignment_score: newApp.alignmentScore,
        alignment_breakdown: newApp.alignmentBreakdown,
        status: newApp.status,
      },
    ])
    .then(({ error }) => {
      if (error) console.warn("Supabase submitCampaignApplication error:", error.message);
    });

  return newApp;
}

export function reviewCampaignApplication(
  id: string,
  status: "approved" | "rejected",
  adminNotes?: string
): CampaignApplication | null {
  const apps = getCampaignApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  apps[idx] = {
    ...apps[idx],
    status,
    adminNotes: adminNotes || (status === "approved" ? "Disetujui oleh Admin." : "Ditolak oleh Admin."),
    reviewedAt: new Date().toISOString(),
  };

  saveCampaignApplications(apps);

  // Sync to Supabase in background
  supabase
    .from("campaign_applications")
    .update({
      status,
      admin_notes: apps[idx].adminNotes,
      reviewed_at: apps[idx].reviewedAt,
    })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.warn("Supabase reviewCampaignApplication error:", error.message);
    });

  return apps[idx];
}

export function isEventInApprovedCampaign(eventId: string): {
  isApproved: boolean;
  campaign?: AdminCampaign;
  application?: CampaignApplication;
} {
  const apps = getCampaignApplications();
  const app = apps.find((a) => String(a.eventId) === String(eventId) && a.status === "approved");
  if (!app) return { isApproved: false };

  const campaigns = getAdminCampaigns();
  const campaign = campaigns.find((c) => c.id === app.campaignId);

  return {
    isApproved: true,
    campaign,
    application: app,
  };
}
