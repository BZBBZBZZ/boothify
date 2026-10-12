"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Booth = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

export default function FloorPlanPage() {
  const [booths, setBooths] = useState<Booth[]>(INITIAL_BOOTHS);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState("fashion");
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_floor_plan");
      if (stored) setBooths(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const saveFloorPlan = () => {
    localStorage.setItem("boothify_floor_plan", JSON.stringify(booths));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      x: 40 + Math.random() * 200,
      y: 80 + Math.random() * 200,
      width: 80,
      height: 60,
      label: nextLabel,
      zone: activeZone,
      price: 2500000,
    };
    setBooths([...booths, newBooth]);
    setSelectedBooth(newBooth);
  };

  const removeBooth = (id: string) => {
    setBooths(booths.filter((b) => b.id !== id));
    if (selectedBooth?.id === id) setSelectedBooth(null);
  };

  const updateBooth = (id: string, updates: Partial<Booth>) => {
    setBooths(booths.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    if (selectedBooth?.id === id) setSelectedBooth({ ...selectedBooth, ...updates });
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
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 80));
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 60));
    // Snap to grid
    const snappedX = Math.round(x / 20) * 20;
    const snappedY = Math.round(y / 20) * 20;
    setBooths((prev) => prev.map((b) => (b.id === dragging ? { ...b, x: snappedX, y: snappedY } : b)));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const getZoneColor = (zone: string) => ZONES.find((z) => z.value === zone)?.color || "var(--zone-general)";

  return (
    <div className="animate-fade-in" id="floor-plan-builder">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Interactive Floor Plan Builder</h1>
        <p className="text-sm text-muted-foreground">Drag & drop booth untuk mengatur tata letak acara</p>
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
                  {ZONES.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={addBooth} className="btn btn-primary w-full btn-sm" id="add-booth-btn">
                + Tambah Booth
              </button>
            </div>
          </div>

          {/* Zone legend */}
          <div className="card-base p-4">
            <h3 className="font-semibold text-sm mb-3">Zona Warna</h3>
            <div className="space-y-2">
              {ZONES.map((z) => (
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
                    {ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">🖱️ Drag booth untuk memindahkan • Klik untuk memilih & edit</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{booths.length} booth</span>
                <button onClick={saveFloorPlan} className="btn btn-primary btn-sm" id="save-floor-plan">
                  {saved ? "✓ Tersimpan!" : "💾 Simpan Layout"}
                </button>
              </div>
            </div>

            {/* Stage */}
            <div className="text-center mb-3">
              <div className="inline-block px-16 py-2 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 border border-border text-xs font-semibold text-muted-foreground">
                🎤 PANGGUNG UTAMA
              </div>
            </div>

            <div
              ref={canvasRef}
              className="floor-plan-canvas"
              style={{ minHeight: 420 }}
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
                    borderColor: getZoneColor(booth.zone),
                    backgroundColor: `color-mix(in srgb, ${getZoneColor(booth.zone)} 15%, transparent)`,
                    color: getZoneColor(booth.zone),
                  }}
                  onMouseDown={(e) => handleMouseDown(e, booth)}
                  onClick={() => setSelectedBooth(booth)}
                >
                  <div className="text-center">
                    <div className="font-bold text-xs">{booth.label}</div>
                    <div className="text-[9px] opacity-70">{ZONES.find((z) => z.value === booth.zone)?.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
