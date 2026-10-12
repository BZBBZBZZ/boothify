"use client";

import { useState } from "react";
import Link from "next/link";

const BOOTH_ROWS = ["A", "B", "C", "D", "E"];
const BOOTHS_PER_ROW = 8;
const TAKEN = ["A1","A3","A5","B2","B4","B6","C1","C3","C7","D2","D5","D8","E1","E3","E6"];
const getZone = (row: string) => {
  if (["A","B"].includes(row)) return { name: "Fashion", color: "var(--zone-fashion)", cls: "booth-zone-fashion" };
  if (["C"].includes(row)) return { name: "F&B", color: "var(--zone-fnb)", cls: "booth-zone-fnb" };
  if (["D"].includes(row)) return { name: "Craft", color: "var(--zone-craft)", cls: "booth-zone-craft" };
  return { name: "Education", color: "var(--zone-education)", cls: "booth-zone-education" };
};

const PRICES: Record<string, number> = { A: 2500000, B: 2500000, C: 3000000, D: 1800000, E: 2000000 };

export default function BoothBookingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [filterZone, setFilterZone] = useState("all");

  const toggle = (id: string) => {
    if (TAKEN.includes(id)) return;
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);
  };

  const total = selected.reduce((sum, id) => sum + (PRICES[id[0]] || 2000000), 0);

  return (
    <div className="animate-fade-in" id="tenant-booth-booking">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Pemesanan Booth — Green Fashion Expo 2026</h1>
        <p className="text-sm text-muted-foreground">Pilih posisi booth yang diinginkan pada denah interaktif</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-6">
          {/* Filter */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
            {[{ v: "all", l: "Semua" }, { v: "Fashion", l: "Fashion" }, { v: "F&B", l: "F&B" }, { v: "Craft", l: "Craft" }, { v: "Education", l: "Education" }].map((f) => (
              <button key={f.v} onClick={() => setFilterZone(f.v)} className={`btn btn-sm ${filterZone === f.v ? "btn-primary" : "btn-secondary"}`}>{f.l}</button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-available" /> Tersedia</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-selected" /> Dipilih</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded booth-taken" /> Terisi</div>
          </div>

          {/* Stage */}
          <div className="text-center mb-6">
            <div className="inline-block px-14 py-2.5 rounded-xl bg-gradient-to-r from-primary/15 to-secondary/15 border border-border text-xs font-semibold text-muted-foreground">
              🎤 PANGGUNG UTAMA
            </div>
          </div>

          {/* Booth Grid */}
          <div className="space-y-2 overflow-x-auto pb-4">
            {BOOTH_ROWS.map((row) => {
              const zone = getZone(row);
              if (filterZone !== "all" && zone.name !== filterZone) return null;
              return (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-muted-foreground text-right">{row}</span>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: BOOTHS_PER_ROW }).map((_, i) => {
                      const id = `${row}${i + 1}`;
                      const isTaken = TAKEN.includes(id);
                      const isSel = selected.includes(id);
                      return (
                        <button key={id} onClick={() => toggle(id)}
                          className={`booth-seat ${isTaken ? "booth-taken" : isSel ? "booth-selected" : `booth-available ${zone.cls}`}`}
                          disabled={isTaken} id={`book-booth-${id}`}>
                          {id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="card-base p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-4">Ringkasan Pemesanan</h3>
          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Pilih booth pada denah</p>
          ) : (
            <div className="space-y-3">
              {selected.map((id) => (
                <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light">{id}</div>
                    <div>
                      <span className="text-sm font-medium">Booth {id}</span>
                      <p className="text-[11px] text-muted-foreground">{getZone(id[0]).name}</p>
                    </div>
                  </div>
                  <span className="text-sm">Rp {(PRICES[id[0]] || 2000000).toLocaleString("id-ID")}</span>
                </div>
              ))}
              <hr className="border-border" />
              <div className="flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="gradient-text text-lg">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <Link href="/dashboard/tenant/bookings/1/checkout" className="btn btn-primary w-full btn-lg mt-2" id="go-checkout">
                Lanjut Pembayaran →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
