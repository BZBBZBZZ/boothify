"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { setActiveOrganizerEventId } from "@/app/lib/event-defaults";
import { getEvent, listOrganizerEvents, updateEvent, errorMessage } from "@/app/lib/db";
import { useAuth } from "@/app/components/AuthContext";
import FreshOnNavigate from "../../../../../components/FreshOnNavigate";

function AICampaignContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "";
  const { user } = useAuth();

  const [topic, setTopic] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [currentTheme, setCurrentTheme] = useState("");
  const [applyError, setApplyError] = useState("");
  const [allEvents, setAllEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<null | {
    campaigns: { title: string; narrative: string; impact: string }[];
    tips: string[];
  }>(null);

  useEffect(() => {
    let cancelled = false;
    setActiveOrganizerEventId(eventId);
    if (user?.id) {
      listOrganizerEvents(user.id)
        .then((list) => {
          if (!cancelled) setAllEvents(list.map((e) => ({ id: e.id, title: e.title })));
        })
        .catch(() => {});
    }
    getEvent(eventId)
      .then((meta) => {
        if (cancelled || !meta) return;
        setEventTitle(meta.title);
        setEventCategory(meta.category);
        setCurrentTheme(meta.theme || "");
        // Start from the event's own theme, else from its category
        const cat = (meta.category || "").toLowerCase();
        setTopic(
          meta.theme ||
            (cat.includes("kuliner") || cat.includes("food")
              ? "Kuliner Nusantara"
              : cat.includes("fashion")
              ? "Fashion Lokal Berkelanjutan"
              : cat.includes("edukasi") || cat.includes("tech")
              ? "Edukasi & Teknologi"
              : cat.includes("kriya") || cat.includes("craft")
              ? "Kriya Lokal Handmade"
              : meta.title)
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId, user?.id]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setAppliedIndex(null);

    {
      const q = topic.toLowerCase();

      let campaigns = [
        {
          title: `#${topic.replace(/\s+/g, "")}Fest — Eksplorasi & Kolaborasi Tanpa Batas`,
          narrative: `Kampanye utama yang memposisikan event sebagai episentrum inovasi ${topic}. Menggabungkan showcase brand terbaik, ruang dialog praktisi, dan instalasi interaktif yang memikat ribuan pengunjung.`,
          impact: "Fokus: komunitas & media sosial",
        },
        {
          title: `Experience ${topic}: Dari Inspirasi Menjadi Aksi`,
          narrative: `Menghubungkan tenant dengan pengunjung melalui workshop langsung, live demonstration, dan exclusive product drop yang hanya bisa didapatkan di venue selama pameran berlangsung.`,
          impact: "Fokus: penjualan langsung di booth",
        },
        {
          title: `Next-Gen ${topic}: Masa Depan Dimulai Hari Ini`,
          narrative: `Fokus pada terobosan masa depan, keberlanjutan, dan pemberdayaan kreator lokal. Sangat kuat untuk menarik liputan media massa dan kolaborasi sponsor tier 1.`,
          impact: "Fokus: liputan media & sponsor",
        },
      ];

      const tips = [
        `Gunakan hashtag #${topic.replace(/\s+/g, "")}Fest${new Date().getFullYear()} secara konsisten di konten pra-event`,
        "Sediakan activation zone atau photo installation yang Instagramable bagi pengunjung",
        "Rancang program 'early bird passport' untuk mendorong traffic booth tenant",
        "Ajak tenant menyajikan program promosi eksklusif yang hanya ada di event",
        "Buat dokumentasi video after-movie untuk materi sponsor edisi berikutnya",
      ];

      if (q.includes("fashion") || q.includes("baju") || q.includes("pakaian") || q.includes("mode")) {
        campaigns = [
          { title: "#FashionForFuture — Mode yang Merawat Bumi", narrative: "Mengajak pengunjung mengenal proses produksi fashion berkelanjutan. Setiap booth menampilkan journey produk dan workshop upcycle.", impact: "Fokus: edukasi produk" },
          { title: "Circular Fashion Fair — Beli, Pakai, Kembalikan", narrative: "Konsep event yang menonjolkan siklus hidup pakaian dengan program take-back dan kurasi vintage berkualitas.", impact: "Fokus: program take-back" },
          { title: "Green Lifestyle Expo — Gaya Hidup Berkelanjutan", narrative: "Campaign holistik mencakup fashion etis, kerajinan tangan, dan gaya hidup minim sampah.", impact: "Fokus: gaya hidup" },
        ];
      }

      setResults({ campaigns, tips });
      setIsGenerating(false);
    }
  };

  // The chosen idea becomes the event's theme, shown on its public page
  const handleApplyCampaign = async (campaign: { title: string; narrative: string }, index: number) => {
    setApplyError("");
    try {
      await updateEvent(eventId, { theme: campaign.title });
      setCurrentTheme(campaign.title);
      setAppliedIndex(index);
    } catch (err) {
      setApplyError(errorMessage(err, "Tema gagal disimpan."));
    }
  };

  return (
    <div className="animate-fade-in" id="ai-campaign-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-foreground/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Ide Campaign Event</h1>
          </div>
          <p className="text-sm text-primary-light font-medium">
            {eventTitle} <span className="text-muted-foreground text-xs font-normal">({eventCategory})</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Ganti Acara:</span>
            <select
              value={eventId}
              onChange={(e) => {
                setActiveOrganizerEventId(e.target.value);
                router.push(`/dashboard/organizer/events/${e.target.value}/ai-campaign`);
              }}
              className="bg-card/90 border border-foreground/10 rounded-lg px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="card-base p-6 mb-6 max-w-2xl">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          Masukkan Topik atau Tema Event
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            className="input-base flex-1"
            placeholder="Contoh: sustainable fashion, green living, eco market..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            id="ai-topic-input"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`btn btn-primary ${isGenerating || !topic.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
            id="ai-generate-btn"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Menyusun ide...
              </>
            ) : (
              <>Generate</>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ide disusun dari topik yang kamu tulis. {currentTheme ? `Tema event saat ini: ${currentTheme}.` : "Event ini belum punya tema."}
        </p>
      </div>

      {/* Loading state */}
      {isGenerating && (
        <div className="max-w-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-base p-6 animate-shimmer">
              <div className="h-4 w-48 bg-foreground/5 rounded mb-3" />
              <div className="h-3 w-full bg-foreground/5 rounded mb-2" />
              <div className="h-3 w-3/4 bg-foreground/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results && !isGenerating && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Campaign Recommendations */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Rekomendasi Campaign
            </h2>
            {applyError && <p className="text-sm text-error mb-3" role="alert">{applyError}</p>}
            <div className="space-y-4">
              {results.campaigns.map((campaign, i) => (
                <div key={i} className="card-base p-6 gradient-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <span className="badge badge-accent text-[10px] whitespace-nowrap">{campaign.impact}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed mb-4">{campaign.narrative}</p>
                  <button
                    onClick={() => handleApplyCampaign(campaign, i)}
                    className={`btn btn-sm ${appliedIndex === i ? "btn-primary" : "btn-secondary"}`}
                    id={`use-campaign-${i}`}
                  >
                    {appliedIndex === i ? "Dipakai sebagai tema event" : "Jadikan Tema Event"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              Tips Implementasi
            </h2>
            <ul className="space-y-2">
              {results.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Note */}
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 text-xs text-muted-foreground">
            Ide di atas adalah titik awal dari template. Sesuaikan dengan kondisi event kamu sebelum dipakai.
          </div>
        </div>
      )}
    </div>
  );
}

function AICampaignPageContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <svg className="animate-spin mx-auto mb-2 text-primary" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <p className="text-xs text-muted-foreground">Memuat ide campaign...</p>
          </div>
        </div>
      }
    >
      <AICampaignContent />
    </Suspense>
  );
}

export default function AICampaignPage() {
  return (
    <FreshOnNavigate>
      <AICampaignPageContent />
    </FreshOnNavigate>
  );
}
