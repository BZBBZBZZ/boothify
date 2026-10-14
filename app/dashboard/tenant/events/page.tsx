"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const EVENT_CATEGORIES = [
  "Kuliner (Food & Beverage)", "Fashion, Beauty & Lifestyle", "Hobi, Pop Culture & Hiburan", "Properti, Interior & Home Living", "Pariwisata (Tour, Travel & Hospitality)", "Wedding & Event Organizer", "Otomotif (Automotive)", "Teknologi, Elektronik & Sains (Tech, Electronic & Science Innovation)", "Edukasi & Karir (Education & Career)", "Seni & Kriya (Art, Craft & Culture)", "Keluarga & Anak (Mom, Baby & Kids)", "Kesehatan, Olahraga & Kebugaran (Health, Fitness & Wellness)", "Agrikultur, Flora & Fauna (Pets & Plants)", "Bisnis, Keuangan & Jasa Profesi (B2B, Finance & Services)", "Lingkungan & Dampak Sosial (Specific SDGs / Green Expo)", "Manufaktur, Industri & Mesin (Industrial & Manufacturing)", "Pemerintah & Pelayanan Publik (Government & Civic)", "Religi, Spiritual & Halal Lifestyle", "Maritim, Aviasi & Transportasi Berat"
];

type TenantEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  country?: string;
  province?: string;
  city?: string;
  category: string;
  categories: string[];
  price: string;
  match: string;
  booths: number;
  image: string;
  scope: string;
};

const EVENTS: TenantEvent[] = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", location: "Jakarta Convention Center, Jakarta", country: "Indonesia", province: "DKI Jakarta", city: "Jakarta Pusat", category: "Fashion", categories: ["Fashion, Beauty & Lifestyle", "Lingkungan & Dampak Sosial (Specific SDGs / Green Expo)"], price: "Rp 2.5Jt", match: "95%", booths: 9, image: "🌿", scope: "Lokal" },
  { id: "2", title: "Indonesia Food Festival 2026", date: "22–24 Nov 2026", location: "ICE BSD, Tangerang", country: "Indonesia", province: "Banten", city: "Tangerang", category: "F&B", categories: ["Kuliner (Food & Beverage)"], price: "Rp 3Jt", match: "95%", booths: 7, image: "🍜", scope: "Lokal" },
  { id: "3", title: "EduTech Innovation Fair 2026", date: "1–3 Des 2026", location: "Surabaya Grand City, Surabaya", country: "Indonesia", province: "Jawa Timur", city: "Surabaya", category: "Education", categories: ["Edukasi & Karir (Education & Career)"], price: "Rp 1.8Jt", match: "92%", booths: 6, image: "📚", scope: "Lokal" },
  { id: "4", title: "AutoMotive Show 2026", date: "10–12 Des 2026", location: "JIEXPO Kemayoran, Jakarta", country: "Indonesia", province: "DKI Jakarta", city: "Jakarta Pusat", category: "Automotive", categories: ["Otomotif (Automotive)"], price: "Rp 5Jt", match: "45%", booths: 8, image: "🚗", scope: "Lokal" },
  { id: "5", title: "Craft & Artisan Market 2026", date: "18–20 Des 2026", location: "Bandung Creative Hub, Bandung", country: "Indonesia", province: "Jawa Barat", city: "Bandung", category: "Craft", categories: ["Seni & Kriya (Art, Craft & Culture)"], price: "Rp 1.2Jt", match: "88%", booths: 7, image: "🎨", scope: "Lokal" },
];

export default function TenantEventsPage() {
  const [eventsList, setEventsList] = useState<TenantEvent[]>(EVENTS);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("match");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        const customEvents = stored.map((e: { id: string; title: string; date: string; location: string; country?: string; province?: string; city?: string; category?: string; categories?: string[]; boothsFilled?: number; boothsTotal?: number; priceRange?: string; image?: string }) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          location: [e.location, e.city, e.province, e.country].filter(Boolean).join(", "),
          country: e.country,
          province: e.province,
          city: e.city,
          category: e.category || "Fashion",
          categories: e.categories || (e.category ? e.category.split(",").map((item) => item.trim()) : ["Kuliner (Food & Beverage)"]),
          price: e.priceRange?.split("–")[0]?.replace("000.000", "Jt")?.trim() || "Rp 2Jt",
          match: "96%",
          booths: (e.boothsTotal || 30) - (e.boothsFilled || 0),
          image: e.image || "🎪",
          scope: e.country && e.country !== "Indonesia" ? "Internasional" : "Lokal",
        }));
        const existingIds = new Set(customEvents.map((e: { id: string }) => e.id));
        const remainingDefaults = EVENTS.filter((e) => !existingIds.has(e.id));
        setEventsList([...customEvents, ...remainingDefaults]);
      }
    } catch { /* ignore */ }
  }, []);

  const locationOptions = Array.from(new Set(eventsList.flatMap((event) => [event.country, event.province, event.city].filter(Boolean) as string[]))).sort();

  const filtered = eventsList.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || e.categories?.some((category) => category.toLowerCase() === selectedCategory.toLowerCase()) || e.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesLocation =
      selectedLocation === "all" ||
      (selectedLocation === "internasional"
        ? e.scope === "Internasional"
        : [e.location, e.country, e.province, e.city].some((value) => value?.toLowerCase().includes(selectedLocation.toLowerCase())));
    return matchesSearch && matchesCategory && matchesLocation;
  }).sort((a, b) => (sortBy === "match" ? parseInt(b.match) - parseInt(a.match) : 0));

  return (
    <div className="animate-fade-in" id="tenant-events">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Cari Event & Smart Matching</h1>
          <span className="badge badge-secondary text-[10px]">✨ AI MATCHING</span>
        </div>
        <p className="text-sm text-muted-foreground">Temukan event lokal & internasional yang paling cocok dengan profil brand kamu</p>
      </div>

      {/* Search & Multi Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative lg:col-span-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" className="input-base pl-11" placeholder="Cari event..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-base" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">Semua Kategori</option>
          {EVENT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className="input-base" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
          <option value="all">Semua Lokasi</option>
          <option value="internasional">🌏 Internasional (ASEAN)</option>
          {locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}
        </select>
        <select className="input-base" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="match">Urutkan: AI Match Tertinggi</option>
          <option value="newest">Terbaru</option>
          <option value="price">Harga Terendah</option>
        </select>
      </div>

      {/* AI Match info */}
      <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 mb-6 text-xs text-muted-foreground">
        ✨ <strong>AI Smart Matching</strong> mencocokkan profil brand & produk kamu dengan event yang paling relevan.
        Persentase menunjukkan tingkat kesesuaian. <em className="text-secondary-light">Template UI — implementasi Gemini API oleh tim developer.</em>
      </div>

      {/* Events */}
      <div className="space-y-4">
        {filtered.map((event, i) => (
          <Link key={event.id} href={`/events/${event.id}`} className="block card-interactive p-5 animate-fade-in opacity-0" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-3xl flex-shrink-0">
                {event.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                  <span className="badge badge-primary text-[10px]">{event.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.location}</span>
                  <span>💰 mulai {event.price}</span>
                  <span>🏪 {event.booths} booth tersedia</span>
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className={`text-xl font-bold ${parseInt(event.match) >= 85 ? "text-primary-light" : parseInt(event.match) >= 60 ? "text-accent-light" : "text-muted-foreground"}`}>
                  {event.match}
                </div>
                <div className="text-[10px] text-muted-foreground">Match</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
