"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { isEventInApprovedCampaign } from "@/app/lib/admin-campaigns";

import { getEventsFromSupabase } from "@/app/lib/supabase-service";

export default function EventsPage() {
  const [eventsList, setEventsList] = useState<Array<{
    id: string;
    title: string;
    date: string;
    location: string;
    category: string;
    categories: string[];
    boothsFilled: number;
    boothsTotal: number;
    price: string;
    image: string;
    gradient: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Ambil data event langsung dari tabel events di Supabase
    getEventsFromSupabase().then((data) => {
      if (data && data.length > 0) {
        setEventsList(
          data.map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            location: e.location,
            category: e.category,
            categories: e.categories && e.categories.length > 0 ? e.categories : [e.category],
            boothsFilled: e.boothsFilled,
            boothsTotal: e.boothsTotal,
            price: e.priceRange?.split("–")[0]?.trim() || "Rp 2.000.000",
            image: e.image || "🎪",
            gradient: e.gradient || "from-emerald-500/20 to-teal-500/20",
          }))
        );
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
          if (Array.isArray(stored)) {
            setEventsList(stored);
          }
        } catch { /* ignore */ }
      }
      setLoading(false);
    });
  }, []);

  const filtered = eventsList
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      const aCamp = isEventInApprovedCampaign(a.id).isApproved ? 1 : 0;
      const bCamp = isEventInApprovedCampaign(b.id).isApproved ? 1 : 0;
      return bCamp - aCamp;
    });

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Jelajahi Event</h1>
            <p className="text-muted max-w-xl">
              Temukan pameran, bazar, dan event di seluruh Indonesia. Booking booth sekarang!
            </p>
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
            {filtered.map((event, i) => {
              const campInfo = isEventInApprovedCampaign(event.id);
              const isHighlight = campInfo.isApproved;

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`card-interactive p-0 overflow-hidden animate-fade-in-up opacity-0 relative transition-all ${
                    isHighlight
                      ? "border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30"
                      : ""
                  }`}
                  style={{ animationDelay: `${i * 80}ms` }}
                  id={`event-listing-${event.id}`}
                >
                  {/* Highlight Campaign Badge */}
                  {isHighlight && (
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/90 text-purple-200 border border-purple-400/50 backdrop-blur-md shadow-md flex items-center gap-1">
                        <span>🌟</span>
                        <span>Official Campaign</span>
                      </span>
                    </div>
                  )}

                  <div className={`h-36 bg-gradient-to-br ${event.gradient} flex items-center justify-center relative`}>
                    <span className="text-5xl">{event.image}</span>
                    {isHighlight && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-400/40 backdrop-blur-md">
                        🎁 Free Tax 0%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {(event.categories || [event.category]).slice(0, 3).map((category) => (
                        <span key={category} className="badge badge-primary text-[10px] max-w-[48%] truncate" title={category}>{category}</span>
                      ))}
                      {(event.categories || []).length > 3 && <span className="text-[10px] text-muted-foreground">+{event.categories.length - 3}</span>}
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
              );
            })}
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
