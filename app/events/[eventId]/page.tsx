"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../components/AuthContext";
import type { FloorPlanBooth, EventTenantInfo, EventDetail } from "../../lib/event-defaults";
import {
  getEvent,
  getBooths,
  getEventTenants,
  getProfile,
  sendOrganizerMessage,
  errorMessage,
} from "@/app/lib/db";
import { loginUrlFor } from "@/app/lib/auth-redirect";
import CategoryPopover from "../../components/CategoryPopover";
import FreshOnNavigate from "../../components/FreshOnNavigate";
import { FacilityList } from "../../components/BoothFacilities";
import { Field, Notice, TabPanel, Tabs } from "../../components/ui";

const PENDING_BOOTHS_KEY = "boothify_pending_booths";

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
  const searchParams = useSearchParams();
  const eventId = (params?.eventId as string) || "";
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing">("loading");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [booths, setBooths] = useState<FloorPlanBooth[]>([]);
  const [tenantsMap, setTenantsMap] = useState<Record<string, EventTenantInfo>>({});
  const [takenBooths, setTakenBooths] = useState<string[]>([]);
  const [selectedBoothLabels, setSelectedBoothLabels] = useState<string[]>([]);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"info" | "booths" | "tenants">(
    tabParam === "booths" ? "booths" : tabParam === "tenants" ? "tenants" : "info"
  );
  // Follow ?tab= whenever the URL changes (e.g. coming back from sign-in to rent a booth)
  useEffect(() => {
    if (tabParam === "booths" || tabParam === "tenants" || tabParam === "info") setActiveTab(tabParam);
  }, [tabParam]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");

    // Restore booths picked before the visitor was asked to sign in
    try {
      const pending = JSON.parse(sessionStorage.getItem(PENDING_BOOTHS_KEY) || "null");
      if (pending && String(pending.eventId) === String(eventId) && Array.isArray(pending.booths)) {
        setSelectedBoothLabels(pending.booths);
        setActiveTab("booths");
      }
    } catch { /* ignore */ }

    Promise.all([getEvent(eventId), getBooths(eventId), getEventTenants(eventId)])
      .then(([ev, boothList, tenants]) => {
        if (cancelled) return;
        if (!ev) {
          setLoadState("missing");
          return;
        }
        setEvent(ev);
        setBooths(boothList);
        setTenantsMap(tenants);
        setTakenBooths(boothList.filter((b) => b.isBooked).map((b) => b.label));
        // Booths taken since they were picked are dropped from the selection
        setSelectedBoothLabels((prev) => prev.filter((label) => boothList.some((b) => b.label === label && !b.isBooked)));
        setLoadState("ready");
        if (ev.organizerId) {
          getProfile(ev.organizerId)
            .then((p) => {
              if (!cancelled) setOrganizerPhone(p?.phone || "");
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(errorMessage(err, "Event gagal dimuat."));
        setLoadState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const toggleBooth = (label: string) => {
    if (takenBooths.includes(label)) return;
    setCheckoutNotice("");
    setSelectedBoothLabels((prev) =>
      prev.includes(label) ? prev.filter((b) => b !== label) : [...prev, label]
    );
  };

  const selectedBoothsData = booths.filter((b) => selectedBoothLabels.includes(b.label));
  const subtotalPrice = selectedBoothsData.reduce((sum, b) => sum + (b.price || 0), 0);

  const handleProceedCheckout = () => {
    if (selectedBoothsData.length === 0) return;
    if (!user || user.role === "guest") {
      // Keep the picked booths, sign in, then come straight back to this tab
      try {
        sessionStorage.setItem(PENDING_BOOTHS_KEY, JSON.stringify({ eventId, booths: selectedBoothLabels }));
      } catch { /* ignore */ }
      router.push(loginUrlFor(`/events/${eventId}?tab=booths`));
      return;
    }
    if (user.role !== "tenant") {
      setCheckoutNotice(
        `Sewa booth hanya bisa dilakukan dengan akun tenant. Kamu sedang masuk sebagai ${user.role === "admin" ? "admin" : "organizer"}.`
      );
      return;
    }
    try {
      sessionStorage.removeItem(PENDING_BOOTHS_KEY);
    } catch { /* ignore */ }
    const picked = selectedBoothsData.map((b) => encodeURIComponent(b.label)).join(",");
    router.push(`/dashboard/tenant/bookings/${eventId}/checkout?booths=${picked}`);
  };

  const registeredTenantsList = Object.values(tenantsMap);

  // Only the organizer who owns this event gets the edit shortcuts
  const isEventOrganizer = Boolean(user && user.role === "organizer" && event?.organizerId === user.id);

  // Organizer's phone as a WhatsApp number (08xx becomes 628xx)
  const waNumber = organizerPhone.replace(/\D/g, "").replace(/^0/, "62");

  if (loadState !== "ready" || !event) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            {loadState === "loading" ? (
              <p className="text-sm text-muted-foreground">Memuat event...</p>
            ) : (
              <div className="card-base p-8">
                <h1 className="page-header-title mb-2">{loadError ? "Event gagal dimuat" : "Event tidak ditemukan"}</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {loadError || "Event ini mungkin sudah dihapus, belum diterbitkan, atau tautannya salah."}
                </p>
                <Link href="/events" className="btn btn-primary">Lihat Semua Event</Link>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
            <div className="event-cover h-48 sm:h-64 relative overflow-hidden">
              {event.image ? (
                <img src={event.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="event-cover-mark" aria-hidden="true">
                  {event.title.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                </span>
              )}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <CategoryPopover categories={event.categories} category={event.category} />
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h1 className="page-header-title">{event.title}</h1>
                <div className="flex items-center gap-2">
                  {isEventOrganizer && (
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/organizer/events/${eventId}/edit`} className="btn btn-secondary btn-sm text-xs" id="edit-event-info-btn">
                        Edit informasi event
                      </Link>
                      <Link href={`/dashboard/organizer/events/${eventId}/floor-plan`} className="btn btn-secondary btn-sm text-xs" id="edit-floor-plan-btn">
                        Edit denah booth
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
                    <p className="font-medium">{event.time || "Belum ditentukan"}</p>
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
                    <p className="text-muted-foreground text-xs">Harga sewa booth</p>
                    <p className="font-medium">{event.priceRange}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs<"info" | "booths" | "tenants">
            label="Bagian halaman event"
            idPrefix="event"
            active={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "info", label: "Informasi event" },
              { key: "booths", label: "Pilih booth", count: Math.max(0, booths.length - takenBooths.length) },
              // Tenants rent booths here; the list of other tenants is for visitors and organizers
              ...(user?.role === "tenant" ? [] : [{ key: "tenants" as const, label: "Daftar tenant", count: registeredTenantsList.length }]),
            ]}
          />

          {/* Tab 1: Informasi */}
          {activeTab === "info" && (
            <TabPanel idPrefix="event" tabKey="info" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="card-base p-6">
                  <h2 className="section-title mb-4">Tentang event</h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">{event.description || "Organizer belum menulis deskripsi event."}</p>
                </div>
                <section className="card-base p-6" id="booth-facilities">
                  <h2 className="section-title">Fasilitas booth</h2>
                  <p className="section-desc mb-4">Yang sudah termasuk harga sewa dan yang perlu kamu bawa sendiri.</p>
                  <FacilityList included={event.facilitiesIncluded} excluded={event.facilitiesExcluded} />
                </section>
                {event.guidelines && (
                  <section className="card-base p-6">
                    <h2 className="section-title mb-4">Panduan untuk tenant</h2>
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{event.guidelines}</p>
                  </section>
                )}
                {(event.zones || []).length > 0 && (
                <div className="card-base p-6">
                  <h2 className="section-title mb-4">Zona booth</h2>
                  <div className="space-y-3">
                    {(event.zones || []).map((zone) => (
                      <div key={zone.name} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/3">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm flex-1">{zone.name}</span>
                        <span className="text-xs text-muted-foreground">{zone.booths} booth</span>
                      </div>
                    ))}
                  </div>
                </div>
                )}
                {(event.highlights || []).length > 0 && (
                <div className="card-base p-6">
                  <h2 className="section-title mb-4">Sorotan acara</h2>
                  <ul className="space-y-2">
                    {(event.highlights || []).map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-muted">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="card-base p-6">
                  <h2 className="section-title mb-4">Penyelenggara</h2>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-secondary font-bold">
                      {event.organizer.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{event.organizer}</p>
                      <p className="text-xs text-muted-foreground">Organizer event</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="btn btn-secondary btn-sm w-full"
                    id="btn-contact-organizer"
                  >
                    Hubungi organizer
                  </button>
                </div>
                <div className="card-base p-6">
                  <h2 className="section-title mb-4">Ketersediaan booth</h2>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold gradient-text">
                      {Math.max(0, booths.length - takenBooths.length)}
                    </div>
                    <p className="text-sm text-muted-foreground">booth tersedia dari total {booths.length} booth</p>
                  </div>
                  <div className="h-2 rounded-full bg-foreground/5 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{
                        width: `${booths.length > 0 ? Math.min(100, (takenBooths.length / booths.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  {!user || user.role === "guest" || user.role === "tenant" ? (
                    <button onClick={() => setActiveTab("booths")} className="btn btn-primary w-full" id="goto-booth-picker">
                      Pilih &amp; sewa booth
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">Sewa booth hanya untuk akun tenant.</p>
                  )}
                </div>
                <Link
                  href={`/events/${eventId}/guide`}
                  className="btn btn-secondary w-full"
                  id="btn-goto-visitor-guide"
                >
                  Buka panduan pengunjung
                </Link>
              </div>
            </TabPanel>
          )}

          {/* Tab 2: Pilih Booth (Denah Hasil Desain Floor Plan Builder) */}
          {activeTab === "booths" && (
            <TabPanel idPrefix="event" tabKey="booths">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Denah Booth Interaktif */}
                <div className="lg:col-span-2">
                  <div className="card-base p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          Denah booth
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Klik booth yang tersedia untuk memilihnya. Kamu bisa memilih lebih dari satu booth.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="badge badge-secondary">{booths.length} booth</span>
                        <span className="badge badge-accent">{booths.length - takenBooths.length} tersedia</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-xs p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-foreground/[0.05] border border-foreground/20" />
                        <span>Tersedia</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 bg-primary/25 border-2 border-foreground" />
                        <span>Dipilih</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-foreground/10 border border-foreground/5 opacity-50" />
                        <span>Sudah terisi</span>
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

                        return (
                          <div
                            key={b.id || b.label}
                            onClick={() => !isTaken && toggleBooth(b.label)}
                            // PERUBAHAN: Tambah `flex flex-col overflow-hidden` dan kurangi padding ke p-1.5/p-2
                            className={`public-floor-plan-booth absolute p-1.5 sm:p-2 flex flex-col overflow-hidden border text-left transition-colors ${
                              isTaken
                                ? "bg-foreground/[0.02] border-foreground/5 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "bg-primary/25 border-2 border-foreground cursor-pointer"
                                : "bg-card hover:bg-foreground/[0.04] border-border hover:border-primary/50 cursor-pointer"
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
                            <div className="public-floor-plan-booth-header w-full min-w-0 mb-0.5">
                              <span className="public-floor-plan-booth-label block font-bold text-xs sm:text-sm text-foreground truncate">{b.label}</span>
                              <span className="public-floor-plan-booth-zone-text">{getZoneDisplay(b.zone)}</span>
                            </div>

                            {/* PERUBAHAN: Penambahan truncate, w-full, dan leading-tight agar teks rapat dan tidak meluber */}
                            <p className="public-floor-plan-booth-price text-[10px] sm:text-xs font-semibold text-primary-light mb-0.5 truncate w-full leading-tight">
                              Rp {(b.price || 0).toLocaleString("id-ID")}
                            </p>
                            <p className="public-floor-plan-booth-size text-[8px] sm:text-[9px] text-muted-foreground truncate w-full leading-tight">
                              Ukuran: {b.sizeCm || "-"}
                            </p>

                            {/* PERUBAHAN: mt-auto memastikan status selalu nempel di bawah kotak */}
                            {isTaken ? (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-foreground/5 w-full min-w-0">
                                <span className="text-[8px] sm:text-[9px] text-muted-foreground block truncate w-full leading-tight">
                                  Terisi: {tenant?.name || "Tenant"}
                                </span>
                              </div>
                            ) : isSelected ? (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-primary/30 flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-foreground w-full min-w-0 leading-tight">
                                <span>Dipilih</span>
                              </div>
                            ) : (
                              <div className="public-floor-plan-booth-status mt-auto pt-1 border-t border-foreground/5 text-[8px] sm:text-[9px] text-muted-foreground truncate w-full leading-tight">
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
                    <h3 className="section-title mb-4">Ringkasan sewa booth</h3>
                    {selectedBoothsData.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-border rounded-xl">
                        <p className="text-sm font-medium mb-1">Belum ada booth dipilih</p>
                        <p className="text-xs text-muted-foreground px-4">
                          Klik booth yang berstatus &quot;Tersedia&quot; pada denah di samping untuk memilih.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {selectedBoothsData.map((b) => (
                            <div key={b.label} className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
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
                                Rp {(b.price || 0).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>

                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium">Fasilitas yang termasuk sewa</summary>
                          <div className="mt-3">
                            <FacilityList included={event.facilitiesIncluded} excluded={event.facilitiesExcluded} compact />
                          </div>
                        </details>
                        <hr className="border-border" />
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-sm text-muted-foreground">Total biaya sewa</span>
                          <span className="gradient-text text-xl">
                            Rp {subtotalPrice.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <button
                          onClick={handleProceedCheckout}
                          className="btn btn-primary w-full btn-lg mt-2"
                          id="proceed-checkout"
                        >
                          {!user || user.role === "guest"
                            ? `Masuk untuk menyewa (${selectedBoothsData.length} booth)`
                            : `Lanjut ke pembayaran (${selectedBoothsData.length} booth)`}
                        </button>
                        {checkoutNotice ? (
                          <p className="text-xs text-error leading-relaxed" role="alert">
                            {checkoutNotice}
                          </p>
                        ) : (!user || user.role === "guest") && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Pilihan booth kamu disimpan. Setelah masuk dengan akun tenant, kamu kembali ke sini untuk membayar.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabPanel>
          )}

          {/* Tab 3: Daftar Tenant Resmi */}
          {activeTab === "tenants" && user?.role !== "tenant" && (
            <TabPanel idPrefix="event" tabKey="tenants">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Tenant terdaftar</h2>
                  <p className="text-xs text-muted-foreground">
                    Brand yang sudah menyewa booth di event ini.
                  </p>
                </div>
              </div>

              {registeredTenantsList.length === 0 ? (
                <div className="text-center py-12 card-base border border-dashed border-border rounded-xl">
                  <p className="font-semibold text-sm mb-1">Belum ada tenant terdaftar</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                    Jadilah brand pertama yang menyewa booth di event ini.
                  </p>
                  <button onClick={() => setActiveTab("booths")} className="btn btn-primary btn-sm">
                    Pilih booth
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredTenantsList.map((tenant) => (
                    <div key={tenant.id} className="card-base p-5 border border-foreground/5 hover:border-primary/40 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-secondary font-bold text-sm">
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
                        href={`/events/${eventId}/guide?booth=${encodeURIComponent(tenant.id)}`}
                        className="btn btn-ghost btn-sm text-xs w-full justify-center"
                      >
                        Lihat menu {tenant.name}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>
          )}
        </div>

        {/* Modal Hubungi Organizer */}
        {showContactModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div className="card-base max-w-lg w-full p-6 relative border-2 border-foreground shadow-2xl">
              <button
                type="button"
                onClick={() => { setShowContactModal(false); setContactSent(false); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-contact-modal"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-secondary font-bold">
                  {event.organizer.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold" id="contact-modal-title">{event.organizer}</h3>
                  <p className="text-xs text-muted-foreground">Penyelenggara {event.title}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5">
                Ada pertanyaan soal booth, fasilitas, atau aturan event? Hubungi organizer langsung:
              </p>

              {/* Quick Contact Buttons */}
              {(waNumber || event.organizerEmail) && (
              <div className={`grid gap-3 mb-5 ${waNumber && event.organizerEmail ? "grid-cols-2" : "grid-cols-1"}`}>
                {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Organizer ${event.title}, saya tertarik seputar sewa booth`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2.5 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-700"
                  id="contact-whatsapp"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  WhatsApp
                </a>
                )}
                {event.organizerEmail && (
                <a
                  href={`mailto:${event.organizerEmail}?subject=${encodeURIComponent(`Pertanyaan Sewa Booth - ${event.title}`)}`}
                  className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2.5"
                  id="contact-email"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </a>
                )}
              </div>
              )}

              {/* In-app Message Form */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Atau kirim pesan lewat Boothify</p>
                {contactSent ? (
                  <Notice tone="ok" title="Pesan terkirim">
                    Organizer akan membalas lewat email atau WhatsApp yang kamu isi.
                  </Notice>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (contactSending) return;
                      setContactError("");
                      setContactSending(true);
                      try {
                        await sendOrganizerMessage({
                          eventId: event.id,
                          name: contactForm.name,
                          email: contactForm.email,
                          phone: contactForm.phone,
                          message: contactForm.message,
                        });
                        setContactSent(true);
                        setContactForm({ name: "", email: "", phone: "", message: "" });
                      } catch (err) {
                        setContactError(errorMessage(err, "Pesan gagal dikirim."));
                      } finally {
                        setContactSending(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Nama / brand" required id="contact-name">
                        {(id) => <input id={id} type="text" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="input-base" />}
                      </Field>
                      <Field label="Email" required id="contact-email-input">
                        {(id) => <input id={id} type="email" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="input-base" />}
                      </Field>
                    </div>
                    <Field label="Nomor WhatsApp" optional id="contact-phone">
                      {(id) => <input id={id} type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="input-base" />}
                    </Field>
                    <Field label="Pertanyaan" required id="contact-message">
                      {(id) => <textarea id={id} required rows={3} placeholder="Contoh: Apakah listrik 900 watt sudah termasuk sewa?" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="input-base resize-none" />}
                    </Field>
                    {contactError && <Notice tone="error">{contactError}</Notice>}
                    <button type="submit" className="btn btn-primary btn-sm w-full" id="submit-contact-form" disabled={contactSending}>
                      {contactSending ? "Mengirim..." : "Kirim pesan"}
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

function EventDetailPageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat event...</div>}>
      <EventDetailContent />
    </Suspense>
  );
}

export default function EventDetailPage() {
  return (
    <FreshOnNavigate>
      <EventDetailPageContent />
    </FreshOnNavigate>
  );
}
