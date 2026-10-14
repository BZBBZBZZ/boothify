"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ALL_EVENTS = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", location: "Jakarta Convention Center", category: "Fashion, Beauty & Lifestyle, Lingkungan & Dampak Sosial", categories: ["Fashion, Beauty & Lifestyle", "Lingkungan & Dampak Sosial"], boothsFilled: 5, boothsTotal: 9, price: "Rp 2.500.000", image: "🌿", gradient: "from-emerald-500/20 to-teal-500/20" },
  { id: "2", title: "Indonesia Food Festival 2026", date: "22–24 Nov 2026", location: "ICE BSD, Tangerang", category: "F&B", categories: ["Kuliner (Food & Beverage)"], boothsFilled: 3, boothsTotal: 10, price: "Rp 3.000.000", image: "🍜", gradient: "from-orange-500/20 to-red-500/20" },
  { id: "3", title: "EduTech Innovation Fair 2026", date: "1–3 Des 2026", location: "Surabaya Grand City", category: "Education", categories: ["Edukasi & Karir (Education & Career)"], boothsFilled: 2, boothsTotal: 8, price: "Rp 1.800.000", image: "📚", gradient: "from-violet-500/20 to-purple-500/20" },
  { id: "4", title: "AutoMotive Show 2026", date: "10–12 Des 2026", location: "JIEXPO Kemayoran", category: "Automotive", categories: ["Otomotif (Automotive)"], boothsFilled: 4, boothsTotal: 12, price: "Rp 5.000.000", image: "🚗", gradient: "from-blue-500/20 to-cyan-500/20" },
  { id: "5", title: "Craft & Artisan Market 2026", date: "18–20 Des 2026", location: "Bandung Creative Hub", category: "Craft", categories: ["Seni & Kriya (Art, Craft & Culture)"], boothsFilled: 3, boothsTotal: 10, price: "Rp 1.200.000", image: "🎨", gradient: "from-pink-500/20 to-rose-500/20" },
];

export default function EventsPage() {
  const [eventsList, setEventsList] = useState(ALL_EVENTS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        const customEvents = stored.map((e: { id: string; title: string; date: string; location: string; category?: string; categories?: string[]; boothsFilled?: number; boothsTotal?: number; priceRange?: string; image?: string }) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          location: e.location,
          category: e.category || "Fashion",
          categories: e.categories || (e.category ? e.category.split(",").map((item) => item.trim()) : ["Fashion, Beauty & Lifestyle"]),
          boothsFilled: e.boothsFilled || 0,
          boothsTotal: e.boothsTotal || 40,
          price: e.priceRange?.split("–")[0]?.trim() || "Rp 2.000.000",
          image: e.image || "🎪",
          gradient: "from-emerald-500/20 to-teal-500/20",
        }));
        const existingIds = new Set(customEvents.map((e: { id: string }) => e.id));
        const remainingDefaults = ALL_EVENTS.filter((e) => !existingIds.has(e.id));
        setEventsList([...customEvents, ...remainingDefaults]);
      }
    } catch { /* ignore */ }
  }, []);

  const filtered = eventsList.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Jelajahi Event</h1>
            <p className="text-muted max-w-xl">Temukan pameran, bazar, dan event di seluruh Indonesia. Booking booth sekarang!</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1 flex items-center">
              <svg 
                className="absolute left-4 z-10 pointer-events-none text-muted-foreground" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="input-base !pl-12 w-full"
                placeholder="Cari event berdasarkan nama atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="event-search"
              />
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">{filtered.length} event ditemukan</p>

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((event, i) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="card-interactive p-0 overflow-hidden animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 80}ms` }}
                id={`event-listing-${event.id}`}
              >
                <div className={`h-36 bg-gradient-to-br ${event.gradient} flex items-center justify-center`}>
                  <span className="text-5xl">{event.image}</span>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {(event.categories || [event.category]).slice(0, 4).map((category) => (
                      <span key={category} className="badge badge-primary text-[10px] max-w-[48%] truncate" title={category}>{category}</span>
                    ))}
                    {(event.categories || []).length > 4 && <span className="text-[10px] text-muted-foreground">+{event.categories.length - 4}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{event.price}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-1">{event.title}</h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      {event.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {event.location}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Booth terisi</span>
                      <span className="font-semibold text-primary-light">{event.boothsFilled}/{event.boothsTotal}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full gradient-primary" style={{ width: `${(event.boothsFilled / event.boothsTotal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Tidak ada event ditemukan</h3>
              <p className="text-sm text-muted-foreground">Coba ubah kata kunci atau filter pencarian</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
