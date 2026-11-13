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
  icon?: string;
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

// Campaigns and applications are stored in Supabase; see app/lib/db.ts.

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
