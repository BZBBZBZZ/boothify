"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getEventMeta,
  getAllOrganizerEvents,
  setActiveOrganizerEventId,
} from "@/app/lib/event-defaults";
import { useAuth } from "@/app/components/AuthContext";

function AICampaignContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user } = useAuth();

  const [topic, setTopic] = useState("");
  const [eventTitle, setEventTitle] = useState("Green Fashion Expo 2026");
  const [eventCategory, setEventCategory] = useState("Fashion");
  const [allEvents, setAllEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<null | {
    trends: { title: string; description: string; source: string }[];
    campaigns: { title: string; narrative: string; impact: string }[];
    tips: string[];
  }>(null);

  useEffect(() => {
    try {
      setActiveOrganizerEventId(eventId);
      const meta = getEventMeta(eventId);
      setEventTitle(meta.title);
      setEventCategory(meta.category);
      setAllEvents(getAllOrganizerEvents(user?.email));

      // Set intelligent default topic based on event category
      const cat = (meta.category || "").toLowerCase();
      if (cat.includes("food") || cat.includes("fnb")) {
        setTopic("Kuliner Nusantara & Street Food Otentik");
      } else if (cat.includes("edu") || cat.includes("tech")) {
        setTopic("EduTech, Coding Academy & AI Classroom");
      } else if (cat.includes("auto")) {
        setTopic("Mobil Listrik & Inovasi Otomotif Ramah Lingkungan");
      } else if (cat.includes("craft")) {
        setTopic("Kriya Lokal Handmade & Upcycled Artisan");
      } else {
        setTopic("Sustainable Fashion & Circular Lifestyle");
      }
    } catch { /* ignore */ }
  }, [eventId, user?.email]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setAppliedIndex(null);

    setTimeout(() => {
      const q = topic.toLowerCase();

      let trends = [
        {
          title: `Pertumbuhan Minat ${topic} di Indonesia 2026`,
          description: `Riset pasar menunjukkan lonjakan minat publik hingga 52% terhadap inovasi ${topic}. Konsumen muda semakin mengutamakan nilai otentisitas dan keterlibatan komunitas.`,
          source: "Indonesia Market Pulse 2026",
        },
        {
          title: `Digital & Interactive Experiences di Sektor ${topic}`,
          description: `Pameran dengan integrasi teknologi dan live experience menghasilkan retensi pengunjung 3.2x lebih lama dibanding format konvensional.`,
          source: "Global Event Forum 2026",
        },
        {
          title: "Community-Driven & Sustainable Commerce",
          description: `Pola belanja offline kini didorong oleh kurasi brand lokal yang memiliki narasi kuat, transparan, dan berorientasi jangka panjang.`,
          source: "Kemenparekraf Insight",
        },
      ];

      let campaigns = [
        {
          title: `🌟 #${topic.replace(/\s+/g, "")}Fest — Eksplorasi & Kolaborasi Tanpa Batas`,
          narrative: `Kampanye utama yang memposisikan event sebagai episentrum inovasi ${topic}. Menggabungkan showcase brand terbaik, ruang dialog praktisi, dan instalasi interaktif yang memikat ribuan pengunjung.`,
          impact: "Sangat Tinggi — Virality & Community Appeal",
        },
        {
          title: `🔥 Experience ${topic}: Dari Inspirasi Menjadi Aksi`,
          narrative: `Menghubungkan tenant dengan pengunjung melalui workshop langsung, live demonstration, dan exclusive product drop yang hanya bisa didapatkan di venue selama pameran berlangsung.`,
          impact: "Tinggi — Direct Sales & Engagement",
        },
        {
          title: `💡 Next-Gen ${topic}: Masa Depan Dimulai Hari Ini`,
          narrative: `Fokus pada terobosan masa depan, keberlanjutan, dan pemberdayaan kreator lokal. Sangat kuat untuk menarik liputan media massa dan kolaborasi sponsor tier 1.`,
          impact: "Sangat Tinggi — Media & Sponsor Value",
        },
      ];

      const tips = [
        `Gunakan hashtag #${topic.replace(/\s+/g, "")}Fest2026 secara konsisten di konten pra-event`,
        "Sediakan activation zone atau photo installation yang Instagramable bagi pengunjung",
        "Rancang program 'early bird passport' untuk mendorong traffic booth tenant",
        "Ajak tenant menyajikan program promosi eksklusif yang hanya ada di event",
        "Buat dokumentasi video after-movie untuk materi sponsor edisi berikutnya",
      ];

      if (q.includes("fashion") || q.includes("baju") || q.includes("pakaian") || q.includes("mode")) {
        trends = [
          { title: "Sustainable Fashion Movement 2026", description: "Peningkatan 45% permintaan fashion ramah lingkungan. Brand dengan transparansi material mendapatkan kepercayaan tertinggi.", source: "Global Fashion Report 2026" },
          { title: "Circular Economy in Indonesia", description: "Inisiatif daur ulang dan upcycling tekstil semakin populer di kalangan milenial dan Gen Z.", source: "Kementerian LHK" },
          { title: "Zero Waste Event Standards", description: "Event fashion tanpa sampah kemasan plastik sekali pakai kini menjadi standar prestise industri.", source: "Event Industry Report" },
        ];
        campaigns = [
          { title: "🌿 #FashionForFuture — Mode yang Merawat Bumi", narrative: "Mengajak pengunjung mengenal proses produksi fashion berkelanjutan. Setiap booth menampilkan journey produk dan workshop upcycle.", impact: "Tinggi — Relevan dengan tren global" },
          { title: "♻️ Circular Fashion Fair — Beli, Pakai, Kembalikan", narrative: "Konsep event yang menonjolkan siklus hidup pakaian dengan program take-back dan kurasi vintage berkualitas.", impact: "Sangat Tinggi — Actionable & Edukatif" },
          { title: "🌱 Green Lifestyle Expo — Gaya Hidup Berkelanjutan", narrative: "Campaign holistik mencakup fashion etis, kerajinan tangan, dan gaya hidup minim sampah.", impact: "Tinggi — Menjangkau segmen luas" },
        ];
      }

      setResults({ trends, campaigns, tips });
      setIsGenerating(false);
    }, 1200);
  };

  const handleApplyCampaign = (campaign: { title: string; narrative: string }, index: number) => {
    try {
      localStorage.setItem("boothify_applied_campaign", JSON.stringify(campaign));
      setAppliedIndex(index);
    } catch {
      // ignore
    }
  };

  return (
    <div className="animate-fade-in" id="ai-campaign-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">AI Campaign & Insights Generator</h1>
            <span className="badge badge-secondary text-[10px]">✨ POWERED BY GEMINI</span>
            <span className="badge badge-primary text-xs">Event #{eventId}</span>
          </div>
          <p className="text-sm text-primary-light font-medium">
            🎯 {eventTitle} <span className="text-muted-foreground text-xs font-normal">({eventCategory})</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Ganti Acara:</span>
            <select
              value={eventId}
              onChange={(e) => {
                setActiveOrganizerEventId(e.target.value);
                router.push(`/dashboard/organizer/events/${e.target.value}/ai-campaign`);
              }}
              className="bg-card/90 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} (ID #{ev.id})
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
                Menganalisis...
              </>
            ) : (
              <>✨ Generate</>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 AI akan melakukan scraping & analisis tren terkait topik ini dari sumber global dan lokal
        </p>
      </div>

      {/* Loading state */}
      {isGenerating && (
        <div className="max-w-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-base p-6 animate-shimmer">
              <div className="h-4 w-48 bg-white/5 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded mb-2" />
              <div className="h-3 w-3/4 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results && !isGenerating && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Trends */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Analisis Tren Terkini
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.trends.map((trend, i) => (
                <div key={i} className="card-base p-5">
                  <h3 className="font-semibold text-sm mb-2">{trend.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{trend.description}</p>
                  <span className="badge badge-secondary text-[10px]">📰 {trend.source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Recommendations */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🎯 Rekomendasi Campaign
            </h2>
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
                    {appliedIndex === i ? "✓ Campaign Diterapkan ke Event" : "Gunakan Campaign Ini"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              💡 Tips Implementasi
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

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 text-xs text-muted-foreground">
            ⚠️ <strong>Catatan:</strong> Hasil analisis dan rekomendasi di atas dihasilkan oleh AI (Gemini API) berdasarkan data tren terkini. 
            Konten ini bersifat saran dan sebaiknya dikurasi lebih lanjut oleh tim event organizer. 
            <em className="text-secondary-light ml-1">Template UI — implementasi Gemini API oleh tim developer.</em>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AICampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <svg className="animate-spin mx-auto mb-2 text-primary" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <p className="text-xs text-muted-foreground">Memuat Generator Kampanye AI...</p>
          </div>
        </div>
      }
    >
      <AICampaignContent />
    </Suspense>
  );
}
