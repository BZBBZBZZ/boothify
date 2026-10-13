"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ensureEventFloorPlanInitialized,
  getEventMeta,
  getAllOrganizerEvents,
  setActiveOrganizerEventId,
  EventDetail,
  EventZone,
} from "@/app/lib/event-defaults";
import { useAuth } from "@/app/components/AuthContext";

type Booth = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  sizeCm?: string;
  label: string;
  zone: string;
  price: number;
};

const ZONES = [
  { value: "fnb", label: "F&B", color: "var(--zone-fnb)" },
  { value: "fashion", label: "Fashion", color: "var(--zone-fashion)" },
  { value: "automotive", label: "Automotive", color: "var(--zone-automotive)" },
  { value: "education", label: "Education", color: "var(--zone-education)" },
  { value: "craft", label: "Craft", color: "var(--zone-craft)" },
  { value: "general", label: "Umum", color: "var(--zone-general)" },
];

const WORKSPACE_WIDTH = 1200;
const WORKSPACE_HEIGHT = 900;

const INITIAL_BOOTHS: Booth[] = [
  { id: "1", x: 40, y: 80, width: 80, height: 60, label: "A1", zone: "fashion", price: 2500000 },
  { id: "2", x: 140, y: 80, width: 80, height: 60, label: "A2", zone: "fashion", price: 2500000 },
  { id: "3", x: 240, y: 80, width: 80, height: 60, label: "A3", zone: "fashion", price: 2500000 },
  { id: "4", x: 340, y: 80, width: 80, height: 60, label: "A4", zone: "fashion", price: 2500000 },
  { id: "5", x: 40, y: 170, width: 80, height: 60, label: "B1", zone: "fnb", price: 3000000 },
  { id: "6", x: 140, y: 170, width: 80, height: 60, label: "B2", zone: "fnb", price: 3000000 },
  { id: "7", x: 240, y: 170, width: 80, height: 60, label: "B3", zone: "fnb", price: 3000000 },
  { id: "8", x: 340, y: 170, width: 80, height: 60, label: "B4", zone: "fnb", price: 3000000 },
  { id: "9", x: 40, y: 260, width: 100, height: 70, label: "C1", zone: "craft", price: 1800000 },
  { id: "10", x: 160, y: 260, width: 100, height: 70, label: "C2", zone: "craft", price: 1800000 },
  { id: "11", x: 280, y: 260, width: 100, height: 70, label: "C3", zone: "education", price: 2000000 },
];

function FloorPlanContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user, isLoading: authLoading } = useAuth();
  const [eventMeta, setEventMeta] = useState<EventDetail>(getEventMeta(eventId));
  const [allEvents, setAllEvents] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [booths, setBooths] = useState<Booth[]>(INITIAL_BOOTHS);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState("fashion");
  const [zones, setZones] = useState<EventZone[]>(ZONES);
  const [newZone, setNewZone] = useState({ label: "", color: "#6b7280" });
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount & when eventId changes
  useEffect(() => {
    try {
      setActiveOrganizerEventId(eventId);
      setEventMeta(getEventMeta(eventId));
      setAllEvents(getAllOrganizerEvents(user?.email));
      const initialized = ensureEventFloorPlanInitialized(eventId);
      setBooths(initialized.booths);
      const storedZones = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_zones`) || "null");
      setZones(Array.isArray(storedZones) && storedZones.length > 0 ? storedZones : ZONES);
    } catch { /* ignore */ }
  }, [eventId, user?.email]);

  const saveFloorPlan = () => {
    try {
      localStorage.setItem(`boothify_event_${eventId}_booths`, JSON.stringify(booths));
      localStorage.setItem("boothify_floor_plan", JSON.stringify(booths));
      localStorage.setItem(`boothify_event_${eventId}_zones`, JSON.stringify(zones));
      // Update boothsTotal on event
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const updatedEvents = storedEvents.map((ev: { id: string; boothsTotal: number; status: string }) =>
        ev.id === eventId ? { ...ev, boothsTotal: booths.length, status: "active" } : ev
      );
      localStorage.setItem("boothify_events", JSON.stringify(updatedEvents));
    } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublishAndGetQR = () => {
    saveFloorPlan();
    router.push(`/dashboard/organizer/events/${eventId}/qr-code`);
  };

  const applyTemplate = (type: "cinema" | "expo" | "cluster") => {
    if (type === "cinema") {
      // 3 rows x 5 columns cinema grid
      const newBooths: Booth[] = [];
      const rows = ["A", "B", "C"];
      rows.forEach((r, rIdx) => {
        const zone = r === "A" ? "fashion" : r === "B" ? "fnb" : "craft";
        const price = r === "A" ? 3500000 : r === "B" ? 3000000 : 2000000;
        for (let c = 1; c <= 5; c++) {
          newBooths.push({
            id: `${r}${c}`,
            x: 30 + (c - 1) * 95,
            y: 80 + rIdx * 90,
            width: 80,
            height: 65,
            label: `${r}${c}`,
            zone,
            price,
          });
        }
      });
      setBooths(newBooths.map((booth) => ({ ...booth, sizeCm: booth.sizeCm || "300 x 300 cm" })));
      setSelectedBooth(null);
    } else if (type === "expo") {
      // Perimeter layout surrounding stage
      const newBooths: Booth[] = [
        { id: "A1", x: 40, y: 70, width: 90, height: 60, label: "A1", zone: "automotive", price: 5000000 },
        { id: "A2", x: 150, y: 70, width: 90, height: 60, label: "A2", zone: "automotive", price: 5000000 },
        { id: "A3", x: 260, y: 70, width: 90, height: 60, label: "A3", zone: "fashion", price: 3000000 },
        { id: "A4", x: 370, y: 70, width: 90, height: 60, label: "A4", zone: "fashion", price: 3000000 },
        { id: "B1", x: 40, y: 160, width: 80, height: 120, label: "B1", zone: "fnb", price: 4000000 },
        { id: "B2", x: 380, y: 160, width: 80, height: 120, label: "B2", zone: "fnb", price: 4000000 },
        { id: "C1", x: 140, y: 280, width: 100, height: 65, label: "C1", zone: "education", price: 2500000 },
        { id: "C2", x: 260, y: 280, width: 100, height: 65, label: "C2", zone: "craft", price: 2200000 },
      ];
      setBooths(newBooths.map((booth) => ({ ...booth, sizeCm: booth.sizeCm || "300 x 300 cm" })));
      setSelectedBooth(null);
    } else {
      setBooths(INITIAL_BOOTHS.map((booth) => ({ ...booth, sizeCm: booth.sizeCm || "300 x 300 cm" })));
    }
  };

  const nextId = String(booths.length + 1);
  const nextLabel = (() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const row = letters[Math.floor(booths.length / 4)] || "Z";
    const col = (booths.length % 4) + 1;
    return `${row}${col}`;
  })();

  const addBooth = () => {
    const newBooth: Booth = {
      id: nextId,
      x: 40 + Math.random() * 300,
      y: 80 + Math.random() * 300,
      width: 80,
      height: 60,
      rotation: 0,
      sizeCm: "300 x 300 cm",
      label: nextLabel,
      zone: activeZone,
      price: 2500000,
    };
    setBooths([...booths, newBooth]);
    setSelectedBooth(newBooth);
  };

  const addZone = () => {
    const label = newZone.label.trim();
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `zona-${zones.length + 1}`;
    if (!label || zones.some((zone) => zone.label.toLowerCase() === label.toLowerCase())) return;
    const createdZone = { ...newZone, value, label };
    setZones((prev) => [...prev, createdZone]);
    setActiveZone(value);
    setNewZone({ label: "", color: "#6b7280" });
  };

  const removeZone = (value: string) => {
    if (zones.length <= 1 || booths.some((booth) => booth.zone === value)) return;
    setZones((prev) => prev.filter((zone) => zone.value !== value));
    if (activeZone === value) setActiveZone(zones[0].value);
  };

  const removeBooth = (id: string) => {
    setBooths(booths.filter((b) => b.id !== id));
    if (selectedBooth?.id === id) setSelectedBooth(null);
  };

  const updateBooth = (id: string, updates: Partial<Booth>) => {
    const current = booths.find((booth) => booth.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    const bounds = getBoothBounds(next);
    next.x = Math.max(bounds.minX, Math.min(next.x, bounds.maxX));
    next.y = Math.max(bounds.minY, Math.min(next.y, bounds.maxY));
    setBooths(booths.map((booth) => (booth.id === id ? next : booth)));
    if (selectedBooth?.id === id) setSelectedBooth(next);
  };

  const getBoothBounds = (booth: Booth) => {
    const angle = ((booth.rotation || 0) * Math.PI) / 180;
    const rotatedWidth = Math.abs(booth.width * Math.cos(angle)) + Math.abs(booth.height * Math.sin(angle));
    const rotatedHeight = Math.abs(booth.width * Math.sin(angle)) + Math.abs(booth.height * Math.cos(angle));
    return {
      minX: Math.max(0, (rotatedWidth - booth.width) / 2),
      maxX: Math.max(0, WORKSPACE_WIDTH - booth.width - (rotatedWidth - booth.width) / 2),
      minY: Math.max(0, (rotatedHeight - booth.height) / 2),
      maxY: Math.max(0, WORKSPACE_HEIGHT - booth.height - (rotatedHeight - booth.height) / 2),
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, booth: Booth) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging(booth.id);
    setDragOffset({ x: e.clientX - rect.left - booth.x, y: e.clientY - rect.top - booth.y });
    setSelectedBooth(booth);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const booth = booths.find((item) => item.id === dragging);
    if (!booth) return;
    const bounds = getBoothBounds(booth);
    const x = Math.max(bounds.minX, Math.min(e.clientX - rect.left - dragOffset.x, bounds.maxX));
    const y = Math.max(bounds.minY, Math.min(e.clientY - rect.top - dragOffset.y, bounds.maxY));
    // Snap to grid
    const snappedX = Math.round(x / 20) * 20;
    const snappedY = Math.round(y / 20) * 20;
    setBooths((prev) => prev.map((b) => (b.id === dragging ? { ...b, x: snappedX, y: snappedY } : b)));
  }, [booths, dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const isAuthorizedOrganizer = Boolean(
    user &&
    user.role === "organizer" &&
    (
      // 1. Matches event organizer email
      (eventMeta.organizerEmail && user.email?.toLowerCase() === eventMeta.organizerEmail.toLowerCase()) ||
      // 2. Demo organizer owns default events (1, 2, 3) or events without specific email
      (user.email === "demo-organizer@boothify.id" && (!eventMeta.organizerEmail || eventMeta.organizerEmail === "demo-organizer@boothify.id")) ||
      // 3. Matches organizer organization/business name or user name
      (eventMeta.organizer && (
        user.businessName?.toLowerCase() === eventMeta.organizer.toLowerCase() ||
        user.name?.toLowerCase() === eventMeta.organizer.toLowerCase()
      ))
    )
  );

  if (!authLoading && user && !isAuthorizedOrganizer) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto py-12 px-4 text-center">
        <div className="card-base p-8 border border-amber-500/30 bg-amber-500/5">
          <span className="text-4xl block mb-3">🔒</span>
          <h2 className="text-xl font-bold mb-2">Akses Terbatas Penyelenggara</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Hanya pihak penyelenggara resmi acara <strong>{eventMeta.title}</strong> ({eventMeta.organizer || eventMeta.organizerEmail}) yang berhak merancang denah tata letak acara ini.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href={`/events/${eventId}`} className="btn btn-primary btn-sm text-xs">
              Lihat Halaman Publik Acara ↗
            </Link>
            <Link href="/dashboard/organizer" className="btn btn-secondary btn-sm text-xs">
              Dashboard Organizer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getZoneColor = (zone: string) => zones.find((item) => item.value === zone)?.color || "var(--zone-general)";

  return (
    <div className="animate-fade-in" id="floor-plan-builder">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Interactive Floor Plan Builder</h1>
            <span className="badge badge-primary text-xs">Event #{eventId}</span>
            <span className="badge badge-secondary text-xs">{eventMeta.category}</span>
          </div>
          <p className="text-sm font-semibold text-primary-light mb-1">
            🎯 {eventMeta.title} <span className="text-muted-foreground font-normal text-xs">({eventMeta.location} • {eventMeta.date})</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
            <span>Ganti Event yang Diedit:</span>
            <select
              value={eventId}
              onChange={(e) => {
                setActiveOrganizerEventId(e.target.value);
                router.push(`/dashboard/organizer/events/${e.target.value}/floor-plan`);
              }}
              className="bg-card/90 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} (ID #{ev.id})
                </option>
              ))}
            </select>
            <span className="text-emerald-400 font-medium">● Perubahan denah langsung sinkron ke halaman Tenant & Pengunjung</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/events/${eventId}`}
            target="_blank"
            className="btn btn-secondary btn-sm text-xs hover:border-primary/50 transition flex items-center gap-1.5"
            id="btn-preview-tenant-view"
            title={`Lihat halaman pemesanan booth untuk ${eventMeta.title}`}
          >
            <span>👁️ Tampilan Tenant (#{eventId})</span>
            <span className="text-[10px] text-muted-foreground">↗</span>
          </Link>
          <Link
            href={`/events/${eventId}/guide`}
            target="_blank"
            className="btn btn-secondary btn-sm text-xs hover:border-accent/50 transition flex items-center gap-1.5"
            id="btn-preview-guide-view"
            title={`Lihat panduan digital pengunjung untuk ${eventMeta.title}`}
          >
            <span>📱 Panduan Pengunjung (#{eventId})</span>
            <span className="text-[10px] text-muted-foreground">↗</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Toolbar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Add booth */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-sm mb-3">Tambah Booth</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Zona Kategori</label>
                <select
                  className="input-base text-sm"
                  value={activeZone}
                  onChange={(e) => setActiveZone(e.target.value)}
                  id="zone-selector"
                >
                  {zones.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={addBooth} className="btn btn-primary w-full btn-sm" id="add-booth-btn">
                + Tambah Booth
              </button>
            </div>
          </div>

          {/* Layout templates */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-sm mb-2">Template Tata Letak</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Terapkan tata letak instan lalu sesuaikan posisi setiap booth.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => applyTemplate("cinema")}
                className="btn btn-secondary w-full btn-sm text-xs justify-start"
              >
                🎬 Template Denah Bioskop (Grid Rapi)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("expo")}
                className="btn btn-secondary w-full btn-sm text-xs justify-start"
              >
                🏛️ Template Expo Hall (Keliling Panggung)
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("cluster")}
                className="btn btn-ghost w-full btn-sm text-xs justify-start"
              >
                🎪 Reset Template Awal
              </button>
            </div>
          </div>

          {/* Zone CRUD */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-sm mb-1">Kategori Zona</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Kelola kategori zona yang dipakai booth event ini.</p>
            <div className="space-y-2 mb-3">
              {zones.map((zone) => (
                <div key={zone.value} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                  <span className="text-xs flex-1 truncate">{zone.label}</span>
                  <button type="button" onClick={() => removeZone(zone.value)} className="text-[10px] text-error disabled:opacity-40" disabled={zones.length <= 1 || booths.some((booth) => booth.zone === zone.value)} aria-label={`Hapus zona ${zone.label}`}>
                    Hapus
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input className="input-base text-xs px-2 col-span-2" placeholder="Nama zona" value={newZone.label} onChange={(e) => setNewZone({ ...newZone, label: e.target.value })} />
              <input className="w-10 h-10 rounded-lg bg-card border border-border p-1" type="color" value={newZone.color} onChange={(e) => setNewZone({ ...newZone, color: e.target.value })} aria-label="Warna zona" />
            </div>
            <button type="button" onClick={addZone} className="btn btn-secondary btn-sm w-full mt-2">+ Tambah Zona</button>
          </div>

          {/* Zone legend */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-sm mb-3">Zona Warna</h3>
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.value} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: z.color }} />
                  <span className="text-xs">{z.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected booth editor */}
          {selectedBooth && (
            <div className="card-base p-4 border-primary/30">
              <h3 className="font-semibold text-sm mb-3">Edit Booth {selectedBooth.label}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Label</label>
                  <input type="text" className="input-base text-sm" value={selectedBooth.label} onChange={(e) => updateBooth(selectedBooth.id, { label: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Zona</label>
                  <select className="input-base text-sm" value={selectedBooth.zone} onChange={(e) => updateBooth(selectedBooth.id, { zone: e.target.value })}>
                    {zones.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Lebar (px)</label>
                    <input type="number" className="input-base text-sm" value={selectedBooth.width} onChange={(e) => updateBooth(selectedBooth.id, { width: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tinggi (px)</label>
                    <input type="number" className="input-base text-sm" value={selectedBooth.height} onChange={(e) => updateBooth(selectedBooth.id, { height: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Harga Sewa (Rp)</label>
                  <input type="number" className="input-base text-sm" value={selectedBooth.price} onChange={(e) => updateBooth(selectedBooth.id, { price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ukuran Asli Booth (cm)</label>
                  <input type="text" className="input-base text-sm" placeholder="Contoh: 300 x 300 cm" value={selectedBooth.sizeCm || ""} onChange={(e) => updateBooth(selectedBooth.id, { sizeCm: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rotasi Booth</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="359" step="15" className="w-full accent-[var(--primary)]" value={selectedBooth.rotation || 0} onChange={(e) => updateBooth(selectedBooth.id, { rotation: Number(e.target.value) })} />
                    <span className="text-xs w-12 text-right">{selectedBooth.rotation || 0}°</span>
                  </div>
                </div>
                <button type="button" onClick={() => updateBooth(selectedBooth.id, { rotation: ((selectedBooth.rotation || 0) + 90) % 360 })} className="btn btn-secondary btn-sm w-full">↻ Putar 90°</button>
                <button onClick={() => removeBooth(selectedBooth.id)} className="btn btn-sm w-full bg-error/10 text-error hover:bg-error/20 border-none">
                  Hapus Booth
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          <div className="card-base p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-xs text-muted-foreground">🖱️ Drag booth untuk memindahkan • Klik untuk edit booth</p>
              <div className="flex items-center gap-2">
                <button onClick={saveFloorPlan} className="btn btn-secondary btn-sm" id="save-floor-plan">
                  {saved ? "✓ Tersimpan!" : "💾 Simpan Draft"}
                </button>
                <button onClick={handlePublishAndGetQR} className="btn btn-primary btn-sm" id="publish-event-btn">
                  🚀 Terbitkan & Dapatkan QR Code →
                </button>
              </div>
            </div>

            {/* Stage */}
            <div className="text-center mb-3">
              <div className="inline-block px-16 py-2 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 border border-border text-xs font-semibold text-muted-foreground">
                🎤 PANGGUNG UTAMA
              </div>
            </div>

            <div className="overflow-auto max-h-[70vh] rounded-2xl" id="floor-plan-scroll-area">
              <div style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT }}>
                <div
                  ref={canvasRef}
                  className="floor-plan-canvas relative"
                  style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT, minHeight: WORKSPACE_HEIGHT }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  id="floor-plan-canvas"
                >
                  {booths.map((booth) => (
                <div
                  key={booth.id}
                  className={`floor-plan-booth ${dragging === booth.id ? "dragging" : ""} ${selectedBooth?.id === booth.id ? "ring-2 ring-primary" : ""}`}
                  style={{
                    left: booth.x,
                    top: booth.y,
                    width: booth.width,
                    height: booth.height,
                    transform: `rotate(${booth.rotation || 0}deg)`,
                    borderColor: getZoneColor(booth.zone),
                    backgroundColor: `color-mix(in srgb, ${getZoneColor(booth.zone)} 15%, transparent)`,
                    color: getZoneColor(booth.zone),
                  }}
                  onMouseDown={(e) => handleMouseDown(e, booth)}
                  onClick={() => setSelectedBooth(booth)}
                >
                  <div className="text-center">
                    <div className="font-bold text-xs">{booth.label}</div>
                    <div className="text-[9px] opacity-70">{zones.find((z) => z.value === booth.zone)?.label}</div>
                  </div>
                </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FloorPlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat denah booth...</div>}>
      <FloorPlanContent />
    </Suspense>
  );
}
