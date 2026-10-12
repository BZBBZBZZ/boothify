"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const EVENT_DATA = {
  id: "1",
  title: "Green Fashion Expo 2026",
  date: "15–17 November 2026",
  time: "10:00 – 21:00 WIB",
  location: "Jakarta Convention Center, Hall A",
  address: "Jl. Jend. Gatot Subroto, Senayan, Jakarta",
  category: "Fashion",
  description: "Green Fashion Expo adalah pameran mode berkelanjutan terbesar di Indonesia, menghadirkan brand-brand fashion yang peduli lingkungan. Event ini menampilkan koleksi sustainable fashion, workshop daur ulang, dan panel diskusi tentang masa depan industri fashion ramah lingkungan.",
  organizer: "PT. Green Events Indonesia",
  boothsFilled: 42,
  boothsTotal: 60,
  priceRange: "Rp 2.500.000 – Rp 5.000.000",
  image: "🌿",
  zones: [
    { name: "Zona A — Sustainable Fashion", booths: 20, color: "zone-fashion" },
    { name: "Zona B — F&B Area", booths: 15, color: "zone-fnb" },
    { name: "Zona C — Craft & Accessories", booths: 15, color: "zone-craft" },
    { name: "Zona D — Education & Workshop", booths: 10, color: "zone-education" },
  ],
  highlights: [
    "100+ brand fashion berkelanjutan",
    "Workshop daur ulang pakaian",
    "Panel diskusi sustainability",
    "Live music & entertainment",
    "Food court eco-friendly",
  ],
};

// Generate booth layout (cinema-style)
const BOOTH_ROWS = ["A", "B", "C", "D", "E", "F"];
const BOOTHS_PER_ROW = 10;
const TAKEN_BOOTHS = ["A1", "A2", "A3", "B2", "B5", "B6", "C1", "C3", "C7", "C8", "D4", "D5", "D6", "E2", "E3", "E8", "F1", "F5", "F6", "F7"];

const getZoneColor = (row: string) => {
  if (["A", "B"].includes(row)) return "booth-zone-fashion";
  if (["C"].includes(row)) return "booth-zone-fnb";
  if (["D"].includes(row)) return "booth-zone-craft";
  return "booth-zone-education";
};

export default function EventDetailPage() {
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "booths" | "tenants">("info");

  const toggleBooth = (boothId: string) => {
    if (TAKEN_BOOTHS.includes(boothId)) return;
    setSelectedBooths((prev) =>
      prev.includes(boothId) ? prev.filter((b) => b !== boothId) : [...prev, boothId]
    );
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/events" className="hover:text-foreground transition">Event</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-foreground">{EVENT_DATA.title}</span>
          </nav>

          {/* Hero */}
          <div className="card-base overflow-hidden mb-8">
            <div className="h-48 sm:h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center relative">
              <span className="text-8xl">{EVENT_DATA.image}</span>
              <div className="absolute top-4 right-4">
                <span className="badge badge-primary">{EVENT_DATA.category}</span>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{EVENT_DATA.title}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tanggal</p>
                    <p className="font-medium">{EVENT_DATA.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Waktu</p>
                    <p className="font-medium">{EVENT_DATA.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Lokasi</p>
                    <p className="font-medium">{EVENT_DATA.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Harga Booth</p>
                    <p className="font-medium">{EVENT_DATA.priceRange}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-8 border-b border-border">
            {([
              { key: "info", label: "Informasi" },
              { key: "booths", label: "Pilih Booth" },
              { key: "tenants", label: "Daftar Tenant" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? "border-primary text-primary-light"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                id={`tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Tentang Event</h2>
                  <p className="text-muted leading-relaxed">{EVENT_DATA.description}</p>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Zona Booth</h2>
                  <div className="space-y-3">
                    {EVENT_DATA.zones.map((zone) => (
                      <div key={zone.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                        <div className={`w-3 h-3 rounded-full bg-${zone.color}`} style={{
                          backgroundColor: zone.color === "zone-fashion" ? "var(--zone-fashion)" :
                            zone.color === "zone-fnb" ? "var(--zone-fnb)" :
                            zone.color === "zone-craft" ? "var(--zone-craft)" : "var(--zone-education)"
                        }} />
                        <span className="text-sm flex-1">{zone.name}</span>
                        <span className="text-xs text-muted-foreground">{zone.booths} booth</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Highlights</h2>
                  <ul className="space-y-2">
                    {EVENT_DATA.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-muted">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Penyelenggara</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                      GE
                    </div>
                    <div>
                      <p className="font-medium text-sm">{EVENT_DATA.organizer}</p>
                      <p className="text-xs text-muted-foreground">Verified Organizer</p>
                    </div>
                  </div>
                  <Link href="/auth/login" className="btn btn-secondary btn-sm w-full">Hubungi Organizer</Link>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Ketersediaan Booth</h2>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold gradient-text">{EVENT_DATA.boothsTotal - EVENT_DATA.boothsFilled}</div>
                    <p className="text-sm text-muted-foreground">booth tersedia dari {EVENT_DATA.boothsTotal}</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${(EVENT_DATA.boothsFilled / EVENT_DATA.boothsTotal) * 100}%` }} />
                  </div>
                  <button onClick={() => setActiveTab("booths")} className="btn btn-primary w-full" id="goto-booth-picker">
                    Pilih Booth Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "booths" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booth Map */}
                <div className="lg:col-span-2">
                  <div className="card-base p-6">
                    <h2 className="text-lg font-semibold mb-2">Denah Booth — Pilih Seperti Kursi Bioskop</h2>
                    <p className="text-sm text-muted-foreground mb-6">Klik booth yang tersedia untuk memilih</p>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-xs">
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-available" /> Tersedia</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-selected" /> Dipilih</div>
                      <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-taken" /> Terisi</div>
                    </div>

                    {/* Stage */}
                    <div className="text-center mb-8">
                      <div className="inline-block px-16 py-3 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border border-border text-sm font-semibold text-muted">
                        🎤 PANGGUNG UTAMA
                      </div>
                    </div>

                    {/* Booth Grid */}
                    <div className="space-y-3 overflow-x-auto pb-4">
                      {BOOTH_ROWS.map((row) => (
                        <div key={row} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-bold text-muted-foreground text-right">{row}</span>
                          <div className="flex items-center gap-2">
                            {Array.from({ length: BOOTHS_PER_ROW }).map((_, i) => {
                              const boothId = `${row}${i + 1}`;
                              const isTaken = TAKEN_BOOTHS.includes(boothId);
                              const isSelected = selectedBooths.includes(boothId);
                              const zoneClass = getZoneColor(row);
                              return (
                                <button
                                  key={boothId}
                                  onClick={() => toggleBooth(boothId)}
                                  className={`booth-seat ${
                                    isTaken ? "booth-taken" : isSelected ? "booth-selected" : `booth-available ${zoneClass}`
                                  }`}
                                  disabled={isTaken}
                                  id={`booth-${boothId}`}
                                  title={isTaken ? `Booth ${boothId} — Terisi` : `Booth ${boothId} — Tersedia`}
                                >
                                  {boothId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Zone legend */}
                    <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--zone-fashion)" }} /> Fashion</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--zone-fnb)" }} /> F&B</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--zone-craft)" }} /> Craft</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background: "var(--zone-education)" }} /> Education</div>
                    </div>
                  </div>
                </div>

                {/* Selection Summary */}
                <div>
                  <div className="card-base p-6 sticky top-24">
                    <h3 className="font-semibold mb-4">Ringkasan Booking</h3>
                    {selectedBooths.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Belum ada booth dipilih.<br />Klik booth pada denah untuk memilih.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedBooths.map((b) => (
                          <div key={b} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light">{b}</div>
                              <span className="text-sm">Booth {b}</span>
                            </div>
                            <span className="text-sm font-medium">Rp 2.500.000</span>
                          </div>
                        ))}
                        <hr className="border-border" />
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total</span>
                          <span className="gradient-text text-lg">Rp {(selectedBooths.length * 2500000).toLocaleString("id-ID")}</span>
                        </div>
                        <Link href="/dashboard/tenant/bookings/1/checkout" className="btn btn-primary w-full btn-lg mt-4" id="proceed-checkout">
                          Lanjut ke Pembayaran
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tenants" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "EcoWear Studio", booth: "A1", category: "Fashion", desc: "Brand fashion daur ulang dari Bandung" },
                  { name: "Green Threads", booth: "A2", category: "Fashion", desc: "Pakaian berbahan organik" },
                  { name: "Nusantara Bites", booth: "C1", category: "F&B", desc: "Street food khas Nusantara" },
                  { name: "CraftHouse", booth: "D4", category: "Craft", desc: "Kerajinan tangan premium" },
                  { name: "EduTech Lab", booth: "E2", category: "Education", desc: "Workshop teknologi interaktif" },
                  { name: "Kopi Keliling", booth: "C3", category: "F&B", desc: "Specialty coffee booth" },
                ].map((tenant) => (
                  <div key={tenant.booth} className="card-base p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-sm">
                        {tenant.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{tenant.name}</h3>
                        <p className="text-xs text-muted-foreground">Booth {tenant.booth}</p>
                      </div>
                      <span className="badge badge-primary text-[10px] ml-auto">{tenant.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tenant.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
