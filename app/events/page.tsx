"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { isEventInApprovedCampaign } from "@/app/lib/admin-campaigns";

import { getEventsFromSupabase } from "@/app/lib/supabase-service";
import Icon from "../components/Icon";

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
    // Ambil data event langsung dari tabel events di Supabase & merge dengan local
    getEventsFromSupabase().then((data) => {
      let combined = (data || []).map((e) => ({
        id: String(e.id),
        title: e.title,
        date: e.date,
        location: e.location,
        category: e.category,
        categories: e.categories && e.categories.length > 0 ? e.categories : [e.category],
        boothsFilled: e.boothsFilled || 0,
        boothsTotal: e.boothsTotal || 30,
        price: e.priceRange?.split("–")[0]?.trim() || "Rp 2.000.000",
        image: e.image || "🎪",
        gradient: e.gradient || "from-emerald-500/20 to-teal-500/20",
      }));

      try {
        const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
        if (Array.isArray(stored)) {
          const existingIds = new Set(combined.map((e) => e.id));
          const missing = stored
            // Drafts are private to their organizer until published
            .filter((e: { id: string; status?: string }) => !existingIds.has(String(e.id)) && e.status !== "draft")
            .map((e: { id: string; title: string; date: string; location: string; category?: string; categories?: string[]; boothsFilled?: number; boothsTotal?: number; priceRange?: string; image?: string; gradient?: string }) => ({
              id: String(e.id),
              title: e.title,
              date: e.date,
              location: e.location || "Venue Acara",
              category: e.category || "Umum",
              categories: e.categories && e.categories.length > 0 ? e.categories : [e.category || "Umum"],
              boothsFilled: e.boothsFilled || 0,
              boothsTotal: e.boothsTotal || 30,
              price: e.priceRange?.split("–")[0]?.trim() || "Rp 2.000.000",
              image: e.image || "🎪",
              gradient: e.gradient || "from-emerald-500/20 to-teal-500/20",
            }));
          if (missing.length > 0) {
            combined = [...missing, ...combined];
          }
        }
      } catch { /* ignore */ }

      setEventsList(combined);
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
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">Jelajahi Event</h1>
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
                  className={`card-interactive p-0 overflow-hidden animate-fade-in-up opacity-0 relative transition-colors ${
                    isHighlight
                      ? "outline outline-2 outline-offset-2 outline-info"
                      : ""
                  }`}
                  style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
                  id={`event-listing-${event.id}`}
                >
                  {/* Highlight Campaign Badge */}
                  {isHighlight && (
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                      <span className="badge event-cover-tag">
                        <Icon name="star" size={16} />
                        <span>Official Campaign</span>
                      </span>
                    </div>
                  )}

                  <div className="event-cover event-cover--card h-36 relative">
                    <span className="event-cover-mark" aria-hidden="true">
                      {event.title.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    </span>
                    {isHighlight && (
                      <span className="absolute bottom-2 right-2 badge bg-success text-white">
                        Free Tax 0%
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
                    <h3 className="font-bold text-base mb-2 line-clamp-1">{event.title}</h3>
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
                      <div className="h-1.5 bg-foreground/10 overflow-hidden">
                        <div className="h-full gradient-primary" style={{ width: `${(event.boothsFilled / event.boothsTotal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-4 flex justify-center text-muted-foreground"><Icon name={eventsList.length === 0 ? "store" : "search"} size={40} /></div>
              <h3 className="text-lg font-semibold mb-2">
                {eventsList.length === 0 ? "Belum ada event yang dipublikasikan" : "Tidak ada event ditemukan"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {eventsList.length === 0
                  ? "Event akan muncul di sini setelah organizer membuat dan mempublikasikannya."
                  : "Coba kata kunci lain."}
              </p>
              {eventsList.length === 0 && (
                <Link href="/auth/register?role=organizer" className="btn btn-primary btn-sm">Daftar sebagai Organizer</Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
