"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { EVENT_CATEGORY_OPTIONS, getEventCategoryLabel } from "@/app/lib/event-categories";
import { DEFAULT_EVENTS_META } from "@/app/lib/event-defaults";
import {
  calculateEventTenantMatch,
  getLoggedInTenantProfile,
  type MatchBreakdown,
  type TenantProfile,
} from "@/app/lib/tenant-match";

const EVENT_CATEGORIES = EVENT_CATEGORY_OPTIONS.map((category) => category.label);

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
  categoryKeys?: string[];
  price: string;
  booths: number;
  boothsTotal?: number;
  boothsFilled?: number;
  image: string;
  scope: string;
  description?: string;
};

import { getEventsFromSupabase } from "@/app/lib/supabase-service";

type SmartFilter = "all" | "high_match" | "matching_category" | "complete_facilities";

export default function TenantEventsPage() {
  const { user } = useAuth();
  const [eventsList, setEventsList] = useState<TenantEvent[]>([]);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile>(() => getLoggedInTenantProfile(user?.email));
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [smartFilter, setSmartFilter] = useState<SmartFilter>("all");
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({ "1": true });

  // Update profil tenant saat user auth berubah
  useEffect(() => {
    setTenantProfile(getLoggedInTenantProfile(user?.email));
  }, [user]);

  // Muat event dari Supabase (atau fallback localStorage)
  useEffect(() => {
    async function loadEvents() {
      try {
        const sbEvents = await getEventsFromSupabase();
        if (sbEvents && sbEvents.length > 0) {
          const mapped: TenantEvent[] = sbEvents.map((e) => ({
            id: String(e.id),
            title: e.title,
            date: e.date,
            location: [e.location, e.city, e.province, e.country].filter(Boolean).join(", "),
            country: e.country,
            province: e.province,
            city: e.city,
            category: e.category || "Fashion",
            categories:
              e.categories ||
              e.categoryKeys?.map(getEventCategoryLabel) ||
              (e.category ? e.category.split(",").map((item: string) => item.trim()) : ["Umum"]),
            categoryKeys: e.categoryKeys,
            price: e.priceRange?.split("–")[0]?.replace("000.000", "Jt")?.trim() || "Rp 2Jt",
            booths: (e.boothsTotal || 30) - (e.boothsFilled || 0),
            boothsTotal: e.boothsTotal || 30,
            boothsFilled: e.boothsFilled || 0,
            image: e.image || "🎪",
            scope: e.country && e.country !== "Indonesia" ? "Internasional" : "Lokal",
            description: e.description,
          }));
          setEventsList(mapped);
          return;
        }

        const stored = localStorage.getItem("boothify_events");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const customEvents: TenantEvent[] = parsed.map((e) => ({
              id: String(e.id),
              title: e.title,
              date: e.date,
              location: [e.location, e.city, e.province, e.country].filter(Boolean).join(", "),
              country: e.country,
              province: e.province,
              city: e.city,
              category: e.category || "Fashion",
              categories:
                e.categories ||
                e.categoryKeys?.map(getEventCategoryLabel) ||
                (e.category ? e.category.split(",").map((item: string) => item.trim()) : ["Kuliner (Food & Beverage)"]),
              categoryKeys: e.categoryKeys,
              price: e.priceRange?.split("–")[0]?.replace("000.000", "Jt")?.trim() || "Rp 2Jt",
              booths: (e.boothsTotal || 30) - (e.boothsFilled || 0),
              boothsTotal: e.boothsTotal || 30,
              boothsFilled: e.boothsFilled || 0,
              image: e.image || "🎪",
              scope: e.country && e.country !== "Indonesia" ? "Internasional" : "Lokal",
              description: e.description,
            }));
            setEventsList(customEvents);
          }
        }
      } catch {
        // Abaikan error parsing
      }
    }

    loadEvents();
  }, []);

  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(eventsList.flatMap((event) => [event.country, event.province, event.city].filter(Boolean) as string[]))
    ).sort();
  }, [eventsList]);

  // Hitung Smart Match untuk setiap event terhadap profil tenant yang login
  const eventsWithMatch = useMemo(() => {
    return eventsList.map((event) => {
      const matchData: MatchBreakdown = calculateEventTenantMatch(event, tenantProfile);
      return {
        ...event,
        matchData,
      };
    });
  }, [eventsList, tenantProfile]);

  // Filter & Pengurutan
  const filteredEvents = useMemo(() => {
    return eventsWithMatch
      .filter((e) => {
        // 1. Search text
        const matchesSearch =
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase());

        // 2. Dropdown Kategori
        const matchesCategory =
          selectedCategory === "all" ||
          e.categories?.some((category) => category.toLowerCase() === selectedCategory.toLowerCase()) ||
          e.category.toLowerCase() === selectedCategory.toLowerCase();

        // 3. Dropdown Lokasi
        const matchesLocation =
          selectedLocation === "all" ||
          (selectedLocation === "internasional"
            ? e.scope === "Internasional"
            : [e.location, e.country, e.province, e.city].some((val) =>
                val?.toLowerCase().includes(selectedLocation.toLowerCase())
              ));

        // 4. Smart Filters
        let matchesSmartFilter = true;
        if (smartFilter === "high_match") {
          matchesSmartFilter = e.matchData.overallScore >= 80;
        } else if (smartFilter === "matching_category") {
          matchesSmartFilter = e.matchData.categoryScore >= 80;
        } else if (smartFilter === "complete_facilities") {
          const meta = DEFAULT_EVENTS_META[e.id];
          matchesSmartFilter = Boolean((meta?.zones && meta.zones.length > 0) || (meta?.highlights && meta.highlights.length >= 3));
        }

        return matchesSearch && matchesCategory && matchesLocation && matchesSmartFilter;
      })
      .sort((a, b) => {
        if (sortBy === "match") {
          return b.matchData.overallScore - a.matchData.overallScore;
        }
        if (sortBy === "price") {
          const priceA = parseInt(a.price.replace(/\D/g, "")) || 0;
          const priceB = parseInt(b.price.replace(/\D/g, "")) || 0;
          return priceA - priceB;
        }
        return 0;
      });
  }, [eventsWithMatch, search, selectedCategory, selectedLocation, smartFilter, sortBy]);

  const toggleExpand = (eventId: string) => {
    setExpandedEventIds((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  return (
    <div className="animate-fade-in" id="tenant-events">
      {/* Header Info */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Cari Event &amp; Smart Matching</h1>
            <span className="badge badge-secondary text-[10px]">AI MATCHING</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sistem mencocokkan kriteria produk, tema keberlanjutan, ketersediaan booth, dan potensi traffic secara dinamis.
          </p>
        </div>

        {/* Tenant Profile Context Badge */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 self-start md:self-auto">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center font-bold text-white text-xs">
            {tenantProfile.brandName.charAt(0).toUpperCase()}
          </div>
          <div className="text-xs">
            <p className="font-semibold text-foreground truncate max-w-[160px]">{tenantProfile.brandName}</p>
            <p className="text-muted-foreground">{getEventCategoryLabel(tenantProfile.category)}</p>
          </div>
        </div>
      </div>

      {/* Smart Filters (Multi-Kriteria) */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Cerdas:</span>

          <button
            type="button"
            onClick={() => setSmartFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              smartFilter === "all"
                ? "bg-primary/20 text-primary-light border-primary/40 shadow-sm"
                : "bg-white/5 text-muted-foreground hover:text-foreground border-white/10"
            }`}
          >
            Semua Event ({eventsWithMatch.length})
          </button>

          <button
            type="button"
            onClick={() => setSmartFilter("high_match")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
              smartFilter === "high_match"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                : "bg-white/5 text-muted-foreground hover:text-foreground border-white/10"
            }`}
          >
            <span>🎯 Kecocokan Sangat Tinggi (≥80%)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300">
              {eventsWithMatch.filter((e) => e.matchData.overallScore >= 80).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSmartFilter("matching_category")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
              smartFilter === "matching_category"
                ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm"
                : "bg-white/5 text-muted-foreground hover:text-foreground border-white/10"
            }`}
          >
            <span>🏷️ Kategori Sesuai</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-500/30 text-teal-300">
              {eventsWithMatch.filter((e) => e.matchData.categoryScore >= 80).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSmartFilter("complete_facilities")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
              smartFilter === "complete_facilities"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm"
                : "bg-white/5 text-muted-foreground hover:text-foreground border-white/10"
            }`}
          >
            <span>🏢 Fasilitas Lengkap</span>
          </button>
        </div>
      </div>

      {/* Search & Location/Category Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="relative lg:col-span-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
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
            className="input-base !pl-11 w-full"
            placeholder="Cari event atau venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-base"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          className="input-base"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="all">Semua Lokasi</option>
          <option value="internasional">🌏 Internasional (ASEAN)</option>
          {locationOptions.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <select
          className="input-base"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="match">Urutkan: AI Match Tertinggi</option>
          <option value="price">Urutkan: Harga Terendah</option>
        </select>
      </div>

      {/* List Event Cards */}
      {filteredEvents.length === 0 ? (
        <div className="card-base p-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="font-semibold text-foreground text-base mb-1">Tidak ada event yang sesuai</p>
          <p className="text-xs mb-4">Coba sesuaikan kata kunci pencarian atau ubah filter cerdas di atas.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedLocation("all");
              setSmartFilter("all");
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, i) => {
            const isExpanded = Boolean(expandedEventIds[event.id]);
            const matchData = event.matchData;
            const isHigh = matchData.overallScore >= 80;

            return (
              <div
                key={event.id}
                className="card-base p-5 transition-all duration-300 border border-white/10 hover:border-white/20 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Main Card Header & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 border border-white/10 flex items-center justify-center text-3xl flex-shrink-0 shadow-sm">
                      {event.image}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-bold text-base hover:text-primary-light transition truncate"
                        >
                          {event.title}
                        </Link>
                        <span className="badge badge-primary text-[10px]">{event.category}</span>
                        {event.scope === "Internasional" && (
                          <span className="badge badge-secondary text-[10px]">🌏 Internasional</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>📅 {event.date}</span>
                        <span>📍 {event.location}</span>
                        <span>💰 mulai {event.price}</span>
                        <span>🏪 {event.booths} booth tersedia</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-2xl font-black flex items-center gap-1 sm:justify-end ${
                          isHigh
                            ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                            : matchData.overallScore >= 60
                            ? "text-teal-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span>{matchData.match}</span>
                        <span className="text-[11px] font-bold text-muted-foreground">Match</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          isHigh
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/5 text-muted-foreground border border-white/10"
                        }`}
                      >
                        {isHigh ? "✨ Sangat Cocok" : matchData.overallScore >= 60 ? "Cukup Cocok" : "Umum"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(event.id)}
                      className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                      aria-expanded={isExpanded}
                      aria-label="Lihat rincian analisis kecocokan"
                    >
                      <span>{isExpanded ? "Tutup Analisis" : "Lihat Analisis Kecocokan"}</span>
                      <span className="text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* Expandable Breakdown Card (Rincian 4 Pilar Kecocokan)                      */}
                {/* ========================================================================= */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-white/10 animate-fade-in space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <span>📊 Rincian Analisis Multi-Kriteria untuk brand</span>
                        <span className="text-primary-light font-bold">&ldquo;{tenantProfile.brandName}&rdquo;</span>
                      </p>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        Formula Pembobotan: 35% + 25% + 20% + 20%
                      </span>
                    </div>

                    {/* Progress Bar 4 Pilar dengan Warna Eksplisit Inline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchData.pillars.map((pillar) => (
                        <div
                          key={pillar.id}
                          className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: pillar.color }}
                              />
                              {pillar.name}
                            </span>
                            <div className="space-x-1.5 text-right">
                              <span className="text-[11px] text-muted-foreground">{pillar.weightLabel}</span>
                              <strong className="font-bold" style={{ color: pillar.color }}>
                                {pillar.score}%
                              </strong>
                            </div>
                          </div>

                          {/* Progress bar container: h-2 w-full bg-white/10 rounded-full overflow-hidden */}
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${pillar.score}%`,
                                backgroundColor: pillar.color,
                              }}
                            />
                          </div>

                          <p className="text-[11px] text-white/70 leading-relaxed pt-0.5">
                            {pillar.reason}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Footer Tindakan Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>💡 Rekomendasi:</span>
                        <span className="text-foreground">
                          {isHigh
                            ? "Segera pesan booth di pameran ini untuk memaksimalkan ROI dan paparan audiens."
                            : "Periksa denah pameran untuk memilih zona strategis yang paling ramai."}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Link
                          href={`/events/${event.id}`}
                          className="btn btn-primary btn-sm text-xs py-2 px-4 shadow-sm"
                        >
                          Pilih &amp; Sewa Booth Sekarang →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
