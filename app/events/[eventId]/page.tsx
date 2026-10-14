"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../components/AuthContext";
import {
  ensureEventFloorPlanInitialized,
  DEFAULT_EVENTS_META,
  FloorPlanBooth,
  EventTenantInfo,
  EventDetail,
} from "../../lib/event-defaults";

const getZoneBadgeColor = (zone: string) => {
  const z = zone.toLowerCase();
  if (z.includes("fnb") || z.includes("food") || z.includes("makanan")) return "bg-amber-500/15 border-amber-500/40 text-amber-400";
  if (z.includes("fash") || z.includes("busana")) return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
  if (z.includes("craft") || z.includes("kriya")) return "bg-rose-500/15 border-rose-500/40 text-rose-400";
  if (z.includes("edu") || z.includes("tech")) return "bg-purple-500/15 border-purple-500/40 text-purple-400";
  if (z.includes("auto")) return "bg-blue-500/15 border-blue-500/40 text-blue-400";
  return "bg-cyan-500/15 border-cyan-500/40 text-cyan-400";
};

const getZoneDisplay = (zone: string) => {
  const z = zone.toLowerCase();
  if (z.includes("fnb")) return "Kuliner (Food & Beverage)";
  if (z.includes("fash")) return "Fashion, Beauty & Lifestyle";
  if (z.includes("craft")) return "Seni & Kriya (Art, Craft & Culture)";
  if (z.includes("edu")) return "Edukasi & Karir (Education & Career)";
  if (z.includes("auto")) return "Otomotif (Automotive)";
  return zone;
};

function EventDetailContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetail>(
    DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"]
  );
  const [booths, setBooths] = useState<FloorPlanBooth[]>([]);
  const [tenantsMap, setTenantsMap] = useState<Record<string, EventTenantInfo>>({});
  const [takenBooths, setTakenBooths] = useState<string[]>([]);
  const [selectedBoothLabels, setSelectedBoothLabels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "booths" | "tenants">("info");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    try {
      // 1. Load Event Info
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const found = storedEvents.find((e: { id: string }) => e.id === eventId);
      const fallbackMeta = DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"];

      if (found) {
        setEvent({
          ...fallbackMeta,
          ...found,
          highlights: fallbackMeta.highlights,
          zones: fallbackMeta.zones,
        });
      } else {
        setEvent(fallbackMeta);
      }

      // 2. Initialize & load floor plan booths and tenants for this event
      const initialized = ensureEventFloorPlanInitialized(eventId);
      setBooths(initialized.booths);
      setTenantsMap(initialized.tenants);

      // 3. Load taken booths
      const eventTaken = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_booked_booths`) || "[]");
      const allTaken = Array.from(new Set([...initialized.booked, ...eventTaken]));
      setTakenBooths(allTaken);
    } catch {
      // ignore
    }
  }, [eventId]);

  const toggleBooth = (label: string) => {
    if (takenBooths.includes(label)) return;
    setSelectedBoothLabels((prev) =>
      prev.includes(label) ? prev.filter((b) => b !== label) : [...prev, label]
    );
  };

  const selectedBoothsData = booths.filter((b) => selectedBoothLabels.includes(b.label));
  const subtotalPrice = selectedBoothsData.reduce((sum, b) => sum + (b.price || 2500000), 0);

  const handleProceedCheckout = () => {
    if (selectedBoothsData.length === 0) return;
    if (user?.role !== "tenant") {
      router.push("/auth/login");
      return;
    }
    const items = selectedBoothsData.map((b) => ({
      booth: b.label,
      zone: getZoneDisplay(b.zone),
      price: b.price || 2500000,
    }));
    localStorage.setItem("boothify_checkout_items", JSON.stringify(items));
    localStorage.setItem("boothify_checkout_eventId", eventId);
    router.push(`/dashboard/tenant/bookings/${eventId}/checkout`);
  };

  const registeredTenantsList = Object.values(tenantsMap);

  // Check if current logged in user is specifically the organizer of this event
  const isEventOrganizer = Boolean(
    user &&
    user.role === "organizer" &&
    (
      // 1. Matches event organizer email
      (event.organizerEmail && user.email?.toLowerCase() === event.organizerEmail.toLowerCase()) ||
      // 2. Demo organizer owns default events (1, 2, 3) or events without specific email
      (user.email === "demo-organizer@boothify.id" && (!event.organizerEmail || event.organizerEmail === "demo-organizer@boothify.id")) ||
      // 3. Matches organizer organization/business name or user name
      (event.organizer && (
        user.businessName?.toLowerCase() === event.organizer.toLowerCase() ||
        user.name?.toLowerCase() === event.organizer.toLowerCase()
      ))
    )
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/events" className="hover:text-foreground transition">
              Event
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-foreground">{event.title}</span>
          </nav>

          {/* Hero */}
          <div className="card-base overflow-hidden mb-8">
            <div className={`h-48 sm:h-64 bg-gradient-to-br ${event.gradient || "from-emerald-500/20 to-teal-500/20"} flex items-center justify-center relative`}>
              <span className="text-8xl">{event.image}</span>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="badge badge-primary">{event.category}</span>
                <Link
                  href={`/events/${eventId}/guide`}
                  className="btn btn-secondary btn-sm text-xs backdrop-blur-md bg-black/40 border-white/20"
                  id="btn-goto-visitor-guide"
                >
                  📱 Buka Panduan Digital →
                </Link>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
                <div className="flex items-center gap-2">
                  {isEventOrganizer && (
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/organizer/events/${eventId}/edit`} className="btn btn-secondary btn-sm text-xs" id="edit-event-info-btn">
                        Edit Informasi Event
                      </Link>
                      <Link href={`/dashboard/organizer/events/${eventId}/floor-plan`} className="btn btn-secondary btn-sm text-xs" id="edit-floor-plan-btn">
                        Edit Denah
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tanggal</p>
                    <p className="font-medium">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Waktu</p>
                    <p className="font-medium">{event.time || "10:00 – 21:00 WIB"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent-light">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Lokasi</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Harga Sewa Booth</p>
                    <p className="font-medium">{event.priceRange}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-8 border-b border-border">
            {([
              { key: "info", label: "Informasi Event" },
              { key: "booths", label: `Pilih Booth (${booths.length - takenBooths.length} Tersedia)` },
              { key: "tenants", label: `Daftar Tenant (${registeredTenantsList.length})` },
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

          {/* Tab 1: Informasi */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Tentang Event</h2>
                  <p className="text-muted leading-relaxed">{event.description}</p>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Zona Booth</h2>
                  <div className="space-y-3">
                    {(event.zones || []).map((zone) => (
                      <div key={zone.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm flex-1">{zone.name}</span>
                        <span className="text-xs text-muted-foreground">{zone.booths} booth</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Highlights Acara</h2>
                  <ul className="space-y-2">
                    {(event.highlights || []).map((h) => (
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
                      {event.organizer.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{event.organizer}</p>
                      <p className="text-xs text-muted-foreground">Official Organizer ✓</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="btn btn-secondary btn-sm w-full"
                    id="btn-contact-organizer"
                  >
                    Hubungi Organizer
                  </button>
                </div>
                <div className="card-base p-6">
                  <h2 className="text-lg font-semibold mb-4">Ketersediaan Booth</h2>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold gradient-text">
                      {Math.max(0, booths.length - takenBooths.length)}
                    </div>
                    <p className="text-sm text-muted-foreground">booth tersedia dari total {booths.length} booth</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{
                        width: `${booths.length > 0 ? Math.min(100, (takenBooths.length / booths.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <button onClick={() => setActiveTab("booths")} className="btn btn-primary w-full" id="goto-booth-picker">
                    Pilih &amp; Sewa Booth Sekarang →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Pilih Booth (Denah Hasil Desain Floor Plan Builder) */}
          {activeTab === "booths" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Denah Booth Interaktif */}
                <div className="lg:col-span-2">
                  <div className="card-base p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          Denah Interaktif Event
                          <span className="badge badge-primary text-[10px]">Real-Time Sync</span>
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Tata letak booth ini dirancang oleh organizer melalui Interactive Floor Plan Builder.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="badge badge-secondary">{booths.length} Total Booth</span>
                        <span className="badge badge-accent">{booths.length - takenBooths.length} Tersedia</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-xs p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-white/[0.05] border border-white/20" />
                        <span>Tersedia</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-emerald-500/20 border-2 border-emerald-400" />
                        <span>Dipilih Anda</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-white/10 border border-white/5 opacity-50" />
                        <span>Sudah Terisi</span>
                      </div>
                    </div>

                    {/* Organizer-authored floor plan */}
                    <div className="overflow-auto rounded-2xl w-full" id="public-floor-plan-scroll-area">
                      {/* PERUBAHAN: min-w-[900px] membuat semua kotak 1.5x lebih besar, aspect ratio menjaga skala layout */}
                      <div className="floor-plan-canvas relative w-full min-w-[900px] aspect-[600/460]">
                      {booths.map((b) => {
                        const isTaken = takenBooths.includes(b.label);
                        const isSelected = selectedBoothLabels.includes(b.label);
                        const tenant = tenantsMap[b.label];
                        const zoneBadge = getZoneBadgeColor(b.zone);

                        return (
                          <div
                            key={b.id || b.label}
                            onClick={() => !isTaken && toggleBooth(b.label)}
                            // PERUBAHAN: Tambah `flex flex-col overflow-hidden` dan kurangi padding ke p-1.5/p-2
                            className={`public-floor-plan-booth absolute p-1.5 sm:p-2 flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                              isTaken
                                ? "bg-white/[0.02] border-white/5 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/10 cursor-pointer scale-[1.02]"
                                : "bg-card hover:bg-white/[0.04] border-border hover:border-primary/50 cursor-pointer"
                            }`}
                            style={{
                              left: `${(b.x / 600) * 100}%`,
                              top: `${(b.y / 460) * 100}%`,
                              width: `${(b.width / 600) * 100}%`,
                              height: `${(b.height / 460) * 100}%`,
                              transform: `rotate(${b.rotation || 0}deg)`,
                            }}
                            id={`booth-card-${b.label}`}
                          >
                            <div className="public-floor-plan-booth-header flex items-center justify-between gap-1 mb-0.5 w-full min-w-0">
                              <span className="public-floor-plan-booth-label font-bold text-xs sm:text-sm text-foreground truncate">{b.label}</span>
                              <span className={`public-floor-plan-booth-zone badge text-[8px] sm:text-[9px] border truncate flex-shrink-0 max-w-[50%] ${zoneBadge}`}>
                                {getZoneDisplay(b.zone)}
                              </span>
                            </div>

                            {/* PERUBAHAN: Penambahan truncate, w-full, dan leading-tight agar teks rapat dan tidak meluber */}
                            <p className="public-floor-plan-booth-price text-[10px] sm:text-xs font-semibold text-primary-light mb-0.5 truncate w-full leading-tight">
                              Rp {(b.price || 2500000).toLocaleString("id-ID")}
                            </p>
                            <p className="public-floor-plan-booth-size text-[8px] sm:text-[9px] text-muted-foreground truncate w-full leading-tight">
                              Ukuran: {b.sizeCm || "-"}
                            </p>

                            {/* PERUBAHAN: mt-auto memastikan status selalu nempel di bawah kotak */}
                            {isTaken ? (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-white/5 w-full min-w-0">
                                <span className="text-[8px] sm:text-[9px] text-muted-foreground block truncate w-full leading-tight">
                                  ✓ Terisi: {tenant?.name || "Tenant"}
                                </span>
                              </div>
                            ) : isSelected ? (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-primary/30 flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-emerald-400 w-full min-w-0 leading-tight">
                                <span>Dipilih</span>
                                <span>✓</span>
                              </div>
                            ) : (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-white/5 text-[8px] sm:text-[9px] text-muted-foreground truncate w-full leading-tight">
                                Pilih booth
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Ringkasan Booking */}
                <div>
                  <div className="card-base p-6 sticky top-24">
                    <h3 className="font-semibold mb-4 text-lg">Ringkasan Sewa Booth</h3>
                    {selectedBoothsData.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-border rounded-xl">
                        <span className="text-3xl block mb-2">🏪</span>
                        <p className="text-sm font-medium mb-1">Belum Ada Booth Dipilih</p>
                        <p className="text-xs text-muted-foreground px-4">
                          Klik booth yang berstatus &quot;Tersedia&quot; pada denah di samping untuk memilih.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {selectedBoothsData.map((b) => (
                            <div key={b.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary-light">
                                  {b.label}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Booth {b.label}</p>
                                  <p className="text-[10px] text-muted-foreground">Zona {getZoneDisplay(b.zone)}</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold">
                                Rp {(b.price || 2500000).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>

                        <hr className="border-border" />
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-sm text-muted-foreground">Total Biaya Sewa:</span>
                          <span className="gradient-text text-xl">
                            Rp {subtotalPrice.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <button
                          onClick={handleProceedCheckout}
                          className="btn btn-primary w-full btn-lg mt-2"
                          id="proceed-checkout"
                        >
                          Lanjut ke Pembayaran ({selectedBoothsData.length} Booth) →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Daftar Tenant Resmi */}
          {activeTab === "tenants" && (
            <div className="animate-fade-in">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Tenant Resmi Terdaftar</h2>
                  <p className="text-xs text-muted-foreground">
                    Daftar brand yang telah resmi mengonfirmasi penyewaan booth di event ini.
                  </p>
                </div>
                <Link
                  href={`/events/${eventId}/guide`}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  📱 Lihat Tampilan Panduan Pengunjung →
                </Link>
              </div>

              {registeredTenantsList.length === 0 ? (
                <div className="text-center py-12 card-base border border-dashed border-border rounded-xl">
                  <span className="text-4xl block mb-2">🏪</span>
                  <p className="font-semibold text-sm mb-1">Belum Ada Tenant Terdaftar</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                    Jadilah brand pertama yang menyewa booth di event bergengsi ini!
                  </p>
                  <button onClick={() => setActiveTab("booths")} className="btn btn-primary btn-sm">
                    Pilih Booth Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredTenantsList.map((tenant) => (
                    <div key={tenant.id} className="card-base p-5 border border-white/5 hover:border-primary/40 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{tenant.name}</h3>
                          <p className="text-xs text-primary-light font-medium">Booth {tenant.id}</p>
                        </div>
                        <span className="badge badge-secondary text-[10px] ml-auto">{tenant.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                        {tenant.desc}
                      </p>
                      <Link
                        href={`/events/${eventId}/guide`}
                        className="btn btn-ghost btn-sm text-xs w-full justify-center"
                      >
                        Buka Katalog / Menu →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Hubungi Organizer */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="card-base max-w-lg w-full p-6 relative border border-border/80 shadow-2xl">
              <button
                type="button"
                onClick={() => { setShowContactModal(false); setContactSent(false); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-contact-modal"
                aria-label="Tutup modal"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                  {event.organizer.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{event.organizer}</h3>
                  <p className="text-xs text-muted-foreground">Penyelenggara {event.title}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                Ada pertanyaan seputar pemilihan booth, fasilitas listrik, atau syarat &amp; ketentuan event? Hubungi tim organizer secara langsung:
              </p>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <a
                  href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Organizer ${event.title}, saya tertarik seputar sewa booth`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2.5 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-400"
                  id="contact-whatsapp"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  Chat WhatsApp
                </a>
                <a
                  href={`mailto:${event.organizerEmail || "admin@greenevents.id"}?subject=${encodeURIComponent(`Pertanyaan Sewa Booth - ${event.title}`)}`}
                  className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2.5"
                  id="contact-email"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Kirim Email
                </a>
              </div>

              {/* In-app Message Form */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-3">Atau kirim pesan langsung di platform:</p>
                {contactSent ? (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center animate-fade-in">
                    <p className="text-primary-light font-semibold text-sm mb-1">✓ Pesan Terkirim!</p>
                    <p className="text-xs text-muted-foreground">Penyelenggara akan membalas pertanyaan Anda secepatnya di inbox organizer.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      try {
                        const messages = JSON.parse(localStorage.getItem("boothify_organizer_inbox") || "[]");
                        messages.unshift({
                          id: "MSG-" + Date.now().toString().slice(-4),
                          eventId: event.id,
                          eventTitle: event.title,
                          organizerEmail: event.organizerEmail || "demo-organizer@boothify.id",
                          senderName: contactForm.name,
                          senderEmail: contactForm.email,
                          senderPhone: contactForm.phone,
                          message: contactForm.message,
                          time: "Baru saja",
                          status: "unread",
                        });
                        localStorage.setItem("boothify_organizer_inbox", JSON.stringify(messages));
                        setContactSent(true);
                      } catch {
                        setContactSent(true);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Nama Anda / Brand"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="input-base text-xs py-2"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email aktif"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="input-base text-xs py-2"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Nomor WhatsApp"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="input-base text-xs py-2"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Tuliskan pertanyaan seputar booth atau fasilitas..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="input-base text-xs resize-none"
                    />
                    <button type="submit" className="btn btn-primary btn-sm w-full" id="submit-contact-form">
                      Kirim Pesan ke Organizer
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat event...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}
