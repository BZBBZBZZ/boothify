"use client";

import { useState } from "react";

export default function AICampaignPage() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<null | {
    trends: { title: string; description: string; source: string }[];
    campaigns: { title: string; narrative: string; impact: string }[];
    tips: string[];
  }>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulated AI response (placeholder for Gemini API integration)
    setTimeout(() => {
      setResults({
        trends: [
          { title: "Sustainable Fashion Movement 2026", description: "Tren global menunjukkan peningkatan 45% permintaan fashion berkelanjutan. Brand yang mengedepankan transparansi rantai pasok mendapatkan kepercayaan konsumen lebih tinggi.", source: "Global Fashion Report 2026" },
          { title: "Circular Economy in Indonesia", description: "Indonesia menargetkan pengurangan limbah tekstil 30% pada 2027. Program daur ulang pakaian semakin populer di kalangan milenial dan Gen Z.", source: "Kementerian LHK" },
          { title: "Zero Waste Events", description: "Event tanpa sampah menjadi standar baru. Penggunaan material biodegradable dan digital ticketing meningkat 60% dibanding tahun lalu.", source: "Event Industry Report" },
        ],
        campaigns: [
          { title: "🌿 #FashionForFuture — Mode yang Merawat Bumi", narrative: "Kampanye yang mengajak pengunjung untuk mengenal proses produksi fashion berkelanjutan. Setiap booth menampilkan journey produk dari bahan baku ramah lingkungan hingga produk jadi. Pengunjung bisa membawa pakaian lama untuk di-upcycle di workshop booth.", impact: "Tinggi — Relevan dengan tren global & lokal" },
          { title: "♻️ Circular Fashion Fair — Beli, Pakai, Kembalikan", narrative: "Konsep event yang menonjolkan siklus hidup produk fashion. Tenant menampilkan program take-back dan resale. Ada zone khusus vintage/secondhand yang dikurasi. Edukasi tentang microplastic dari fast fashion.", impact: "Sangat Tinggi — Actionable & Edukatif" },
          { title: "🌱 Green Lifestyle Expo — Hidup Bijak, Mulai dari Pilihan", narrative: "Campaign holistik yang tidak hanya mencakup fashion tapi juga gaya hidup berkelanjutan. Kolaborasi lintas sektor: fashion, F&B organik, dan teknologi hijau. Setiap tenant menyertakan green scorecard pada produk mereka.", impact: "Tinggi — Menarik audience lintas segment" },
        ],
        tips: [
          "Gunakan hashtag campaign di seluruh materi promosi digital",
          "Sediakan booth edukasi interaktif untuk meningkatkan engagement",
          "Kolaborasikan dengan influencer sustainability lokal",
          "Siapkan merchandise event dari bahan daur ulang",
          "Dokumentasikan dampak positif event untuk laporan sustainability",
        ],
      });
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="animate-fade-in" id="ai-campaign-page">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">AI Campaign & Insights Generator</h1>
          <span className="badge badge-secondary text-[10px]">✨ POWERED BY GEMINI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Analisis tren global & lokal, dapatkan rekomendasi narasi campaign yang berdampak tinggi untuk event kamu
        </p>
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
                  <button className="btn btn-secondary btn-sm" id={`use-campaign-${i}`}>
                    Gunakan Campaign Ini
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
