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

type LayoutObject = {
  id: string;
  type: "line" | "box" | "ellipse" | "circle" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text?: string;
};

const ZONES = [
  { value: "fnb", label: "Kuliner (Food & Beverage)", color: "var(--zone-fnb)" },
  { value: "fashion", label: "Fashion, Beauty & Lifestyle", color: "var(--zone-fashion)" },
  { value: "hobby", label: "Hobi, Pop Culture & Hiburan", color: "var(--zone-hobby)" },
  { value: "property", label: "Properti, Interior & Home Living", color: "var(--zone-property)" },
  { value: "tourism", label: "Pariwisata (Tour, Travel & Hospitality)", color: "var(--zone-tourism)" },
  { value: "wedding", label: "Wedding & Event Organizer", color: "var(--zone-wedding)" },
  { value: "automotive", label: "Otomotif (Automotive)", color: "var(--zone-automotive)" },
  { value: "tech", label: "Teknologi, Elektronik & Sains (Tech, Electronic & Science Innovation)", color: "var(--zone-tech)" },
  { value: "education", label: "Edukasi & Karir (Education & Career)", color: "var(--zone-education)" },
  { value: "craft", label: "Seni & Kriya (Art, Craft & Culture)", color: "var(--zone-craft)" },
  { value: "family", label: "Keluarga & Anak (Mom, Baby & Kids)", color: "var(--zone-family)" },
  { value: "health", label: "Kesehatan, Olahraga & Kebugaran (Health, Fitness & Wellness)", color: "var(--zone-health)" },
  { value: "agriculture", label: "Agrikultur, Flora & Fauna (Pets & Plants)", color: "var(--zone-agriculture)" },
  { value: "business", label: "Bisnis, Keuangan & Jasa Profesi (B2B, Finance & Services)", color: "var(--zone-business)" },
  { value: "environment", label: "Lingkungan & Dampak Sosial (Specific SDGs / Green Expo)", color: "var(--zone-environment)" },
  { value: "industrial", label: "Manufaktur, Industri & Mesin (Industrial & Manufacturing)", color: "var(--zone-industrial)" },
  { value: "government", label: "Pemerintah & Pelayanan Publik (Government & Civic)", color: "var(--zone-government)" },
  { value: "religion", label: "Religi, Spiritual & Halal Lifestyle", color: "var(--zone-religion)" },
  { value: "maritime", label: "Maritim, Aviasi & Transportasi Berat", color: "var(--zone-maritime)" },
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
  const [layoutObjects, setLayoutObjects] = useState<LayoutObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<LayoutObject | null>(null);
  const [draggingObject, setDraggingObject] = useState<string | null>(null);
  const [boothQuantity, setBoothQuantity] = useState(1);
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});
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
      const storedObjects = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_objects`) || "[]");
      setLayoutObjects(Array.isArray(storedObjects) ? storedObjects : []);
    } catch { /* ignore */ }
  }, [eventId, user?.email]);

  const saveFloorPlan = () => {
    try {
      localStorage.setItem(`boothify_event_${eventId}_booths`, JSON.stringify(booths));
      localStorage.setItem("boothify_floor_plan", JSON.stringify(booths));
      localStorage.setItem(`boothify_event_${eventId}_zones`, JSON.stringify(zones));
      localStorage.setItem(`boothify_event_${eventId}_objects`, JSON.stringify(layoutObjects));
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
      // Perimeter layout for an open central area
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

  const nextLabel = (() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const row = letters[Math.floor(booths.length / 4)] || "Z";
    const col = (booths.length % 4) + 1;
    return `${row}${col}`;
  })();

  const addBooth = () => {
    const created = Array.from({ length: boothQuantity }, (_, index) => {
      const sequence = booths.length + index + 1;
      const row = String.fromCharCode(65 + Math.floor(sequence / 10));
      const label = `${row}${(sequence % 10) || 10}`;
      return {
        id: `${Date.now()}-${index}`,
        x: 40 + (index % 5) * 120,
        y: 80 + Math.floor(index / 5) * 100,
        width: 80,
        height: 60,
        rotation: 0,
        sizeCm: "300 x 300 cm",
        label: label || nextLabel,
        zone: activeZone,
        price: 2500000,
      };
    });
    setBooths((prev) => [...prev, ...created]);
    setSelectedBooth(created[0]);
  };

  const addLayoutObject = (type: LayoutObject["type"]) => {
    const object: LayoutObject = {
      id: `object-${layoutObjects.length + 1}`,
      type,
      x: 180,
      y: 380,
      width: type === "line" ? 180 : 140,
      height: type === "line" ? 4 : 80,
      rotation: 0,
      text: type === "text" ? "Label area" : undefined,
    };
    setLayoutObjects((prev) => [...prev, object]);
    setSelectedObject(object);
  };

  const togglePanel = (panel: string) => setOpenPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));

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

  const handlePointerDown = useCallback((e: React.PointerEvent, booth: Booth) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging(booth.id);
    setDragOffset({ x: e.clientX - rect.left - booth.x, y: e.clientY - rect.top - booth.y });
    
    setSelectedBooth(booth);
    setSelectedObject(null);
    
    setOpenPanels(prev => ({
      ...prev,
      editBooth: true
    }));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (draggingObject) {
      const object = layoutObjects.find((item) => item.id === draggingObject);
      if (!object) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, WORKSPACE_WIDTH - object.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, WORKSPACE_HEIGHT - object.height));
      const updated = { ...object, x: Math.round(x / 20) * 20, y: Math.round(y / 20) * 20 };
      setLayoutObjects((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setSelectedObject(updated);
      return;
    }
    if (!dragging) return;
    const booth = booths.find((item) => item.id === dragging);
    if (!booth) return;
    const bounds = getBoothBounds(booth);
    const x = Math.max(bounds.minX, Math.min(e.clientX - rect.left - dragOffset.x, bounds.maxX));
    const y = Math.max(bounds.minY, Math.min(e.clientY - rect.top - dragOffset.y, bounds.maxY));
    // Snap to grid
    const snappedX = Math.round(x / 20) * 20;
    const snappedY = Math.round(y / 20) * 20;
    setBooths((prev) => prev.map((b) => (b.id === dragging ? { ...b, x: snappedX, y: snappedY } : b)));
  }, [booths, dragging, draggingObject, dragOffset, layoutObjects]);

  const handlePointerUp = useCallback((e?: React.PointerEvent) => {
    if (e && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
    setDraggingObject(null);
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
            <span className="badge badge-primary text-xs shrink-0">Event #{eventId}</span>
            {/* INI BAGIAN YANG DIUBAH */}
            <span className="badge badge-secondary text-xs truncate max-w-[200px] md:max-w-md inline-block">
              {eventMeta.category}
            </span>
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
            <button type="button" onClick={() => togglePanel("booth")} className="w-full flex items-center justify-between font-semibold text-sm">
              Tambah Booth <span>{openPanels.booth ? "⌃" : "⌄"}</span>
            </button>
            {openPanels.booth && <div className="space-y-3 mt-3">
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
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Jumlah booth</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBoothQuantity((value) => Math.max(1, value - 1))}>−</button>
                  <span className="w-8 text-center font-semibold">{boothQuantity}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBoothQuantity((value) => value + 1)}>+</button>
                </div>
              </div>
              <button onClick={addBooth} className="btn btn-primary w-full btn-sm" id="add-booth-btn">
                + Tambah Booth
              </button>
            </div>}
          </div>

          <div className="card-base p-4">
            <button type="button" onClick={() => togglePanel("objects")} className="w-full flex items-center justify-between font-semibold text-sm">
              Static Object <span>{openPanels.objects ? "⌃" : "⌄"}</span>
            </button>
            {openPanels.objects && <div className="grid grid-cols-2 gap-2 mt-3">
              {(["line", "box", "ellipse", "circle", "text"] as const).map((type) => (
                <button key={type} type="button" onClick={() => addLayoutObject(type)} className="btn btn-secondary btn-sm text-xs capitalize">
                  + {type}
                </button>
              ))}
            </div>}
          </div>

          {/* Layout templates */}
          <div className="card-base p-4">
            <button type="button" onClick={() => togglePanel("templates")} className="w-full flex items-center justify-between font-semibold text-sm">
              Template Tata Letak <span>{openPanels.templates ? "⌃" : "⌄"}</span>
            </button>
            {openPanels.templates && <div>
            <p className="text-[11px] text-muted-foreground mb-3"></p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => applyTemplate("cinema")}
                className="btn btn-secondary w-full btn-sm text-xs justify-start"
              >
                Grid Rapi
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("expo")}
                className="btn btn-secondary w-full btn-sm text-xs justify-start"
              >
                Melingkar
              </button>
              <button
                type="button"
                onClick={() => applyTemplate("cluster")}
                className="btn btn-ghost w-full btn-sm text-xs justify-start"
              >
                Reset Template
              </button>
            </div></div>}
          </div>

          {/* Zone CRUD */}
          <div className="card-base p-4">
            <button type="button" onClick={() => togglePanel("zones")} className="w-full flex items-center justify-between font-semibold text-sm">
              Kategori Zona <span>{openPanels.zones ? "⌃" : "⌄"}</span>
            </button>
            {openPanels.zones && <div>
            <p className="text-[11px] text-muted-foreground mb-3 mt-2">Kelola kategori zona yang dipakai booth event ini.</p>
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
            </div>}
          </div>

          {/* Zone legend */}
          <div className="card-base p-4">
            <button type="button" onClick={() => togglePanel("legend")} className="w-full flex items-center justify-between font-semibold text-sm">
              Zona Warna <span>{openPanels.legend ? "⌃" : "⌄"}</span>
            </button>
            {openPanels.legend && <div className="mt-3">
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.value} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: z.color }} />
                  <span className="text-xs">{z.label}</span>
                </div>
              ))}
            </div></div>}
          </div>

          {/* Selected booth editor */}
          {/* Selected booth editor */}
          {selectedBooth && (
            <div className="card-base p-4 border-primary/30">
              <button 
                type="button" 
                onClick={() => togglePanel("editBooth")} 
                className="w-full flex items-center justify-between font-semibold text-sm"
              >
                Edit Booth {selectedBooth.label} <span>{openPanels.editBooth ? "⌃" : "⌄"}</span>
              </button>
              
              {openPanels.editBooth && (
                <div className="space-y-3 mt-3">
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
              )}
            </div>
          )}

          {/* Selected object editor */}
          {selectedObject && (
            <div className="card-base p-4 border-secondary/30">
              <button 
                type="button" 
                onClick={() => togglePanel("editObject")} 
                className="w-full flex items-center justify-between font-semibold text-sm"
              >
                Edit Object <span>{openPanels.editObject ? "⌃" : "⌄"}</span>
              </button>
              
              {openPanels.editObject && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
                      <label key={key} className="text-xs text-muted-foreground">{key}
                        <input type="number" className="input-base text-sm mt-1" value={selectedObject[key]} onChange={(e) => {
                          const updated = { ...selectedObject, [key]: Number(e.target.value) };
                          setSelectedObject(updated);
                          setLayoutObjects((prev) => prev.map((item) => item.id === updated.id ? updated : item));
                        }} />
                      </label>
                    ))}
                  </div>
                  {selectedObject.type === "text" && <input className="input-base text-sm mt-2" value={selectedObject.text || ""} onChange={(e) => {
                    const updated = { ...selectedObject, text: e.target.value };
                    setSelectedObject(updated);
                    setLayoutObjects((prev) => prev.map((item) => item.id === updated.id ? updated : item));
                  }} />}
                  <button type="button" className="btn btn-sm w-full bg-error/10 text-error mt-3" onClick={() => {
                    setLayoutObjects((prev) => prev.filter((item) => item.id !== selectedObject.id));
                    setSelectedObject(null);
                  }}>Hapus Object</button>
                </div>
              )}
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

            <div className="overflow-auto max-h-[70vh] rounded-2xl" id="floor-plan-scroll-area">
              <div style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT }}>
                <div
                  ref={canvasRef}
                  className="floor-plan-canvas relative"
                  style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT, minHeight: WORKSPACE_HEIGHT }}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  id="floor-plan-canvas"
                >
                  {layoutObjects.map((object) => (
                    <div
                      key={object.id}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setDraggingObject(object.id);
                        setDragOffset({ x: event.clientX - rect.left - object.x, y: event.clientY - rect.top - object.y });
                        
                        setSelectedObject(object);
                        setSelectedBooth(null);
                        
                        setOpenPanels(prev => ({
                          ...prev,
                          editObject: true
                        }));
                      }}
                      onClick={(event) => { event.stopPropagation(); setSelectedObject(object); }}
                      className={`absolute flex items-center justify-center text-xs text-secondary-light touch-none ${selectedObject?.id === object.id ? "ring-2 ring-secondary" : ""}`}
                      style={{
                        left: object.x,
                        top: object.y,
                        width: object.width,
                        height: object.height,
                        transform: `rotate(${object.rotation || 0}deg)`,
                        border: object.type === "line" ? "none" : "2px solid var(--secondary)",
                        borderRadius: object.type === "circle" ? "999px" : object.type === "ellipse" ? "50%" : "6px",
                        background: object.type === "box" ? "rgba(139,92,246,.08)" : "transparent",
                      }}
                    >
                      {object.type === "line" && <span className="w-full h-0.5 bg-secondary" />}
                      {object.type === "text" && object.text}
                    </div>
                  ))}
                  {booths.map((booth) => (
                <div
                  key={booth.id}
                  className={`floor-plan-booth touch-none ${dragging === booth.id ? "dragging" : ""} ${selectedBooth?.id === booth.id ? "ring-2 ring-primary" : ""}`}
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
                  onPointerDown={(e) => handlePointerDown(e, booth)}
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
