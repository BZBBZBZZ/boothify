"use client";

import { useState } from "react";

type Booth = {
  label: string;
  zone: "A" | "B" | "C";
  taken: boolean;
};

const ZONES = {
  A: { name: "Sustainable Fashion", tone: "fashion" },
  B: { name: "F&B Corner & Kafe", tone: "fnb" },
  C: { name: "Craft & Aksesoris Etnik", tone: "craft" },
} as const;

/* Illustration of a sample hall for the hero; not real event data. */
const BOOTHS: Booth[] = [
  { label: "A1", zone: "A", taken: true },
  { label: "A2", zone: "A", taken: false },
  { label: "A3", zone: "A", taken: true },
  { label: "A4", zone: "A", taken: false },
  { label: "B1", zone: "B", taken: false },
  { label: "B2", zone: "B", taken: true },
  { label: "B3", zone: "B", taken: false },
  { label: "C1", zone: "C", taken: false },
  { label: "C2", zone: "C", taken: false },
];

export default function HomeFloorPlan() {
  const [picked, setPicked] = useState("A2");
  const booth = BOOTHS.find((b) => b.label === picked) ?? BOOTHS[1];
  const zone = ZONES[booth.zone];
  const open = BOOTHS.filter((b) => !b.taken).length;

  const renderBooth = (b: Booth) => {
    const isPicked = b.label === picked;
    const state = b.taken ? "terisi" : isPicked ? "dipilih" : "tersedia";
    return (
      <button
        key={b.label}
        type="button"
        className={`plan-booth plan-booth--${ZONES[b.zone].tone}`}
        data-state={state}
        disabled={b.taken}
        aria-pressed={isPicked}
        aria-label={`Booth ${b.label}, Zona ${b.zone} ${ZONES[b.zone].name}, ${state}`}
        onClick={() => setPicked(b.label)}
      >
        {b.label}
      </button>
    );
  };

  return (
    <figure className="desk-stage" aria-label="Contoh denah booth interaktif">
      {/* The floor plan, a cotton sheet on the desk */}
      <div className="plan-sheet">
        <div className="plan-sheet-head">
          <p className="plan-sheet-title">Denah Hall A</p>
          <p className="plan-sheet-meta">Contoh tata letak</p>
        </div>
        <div className="plan-hall">
          <div className="plan-zone plan-zone--a">
            <p className="plan-zone-name">Zona A</p>
            <div className="plan-row">{BOOTHS.filter((b) => b.zone === "A").map(renderBooth)}</div>
          </div>
          <div className="plan-zone plan-zone--b">
            <p className="plan-zone-name">Zona B</p>
            <div className="plan-row">{BOOTHS.filter((b) => b.zone === "B").map(renderBooth)}</div>
          </div>
          <div className="plan-stage">Panggung runway</div>
          <div className="plan-zone plan-zone--c">
            <p className="plan-zone-name">Zona C</p>
            <div className="plan-row">{BOOTHS.filter((b) => b.zone === "C").map(renderBooth)}</div>
          </div>
          <div className="plan-door">Pintu masuk</div>
        </div>
      </div>

      {/* The pick, an index card laid over the sheet */}
      <div className="plan-card" aria-live="polite">
        <p className="plan-card-label">Booth dipilih</p>
        <p className="plan-card-figure">{booth.label}</p>
        <p className="plan-card-zone">
          Zona {booth.zone}
          <br />
          {zone.name}
        </p>
        <p className="plan-card-open">
          <span className="fig">{open}</span> dari <span className="fig">{BOOTHS.length}</span> booth tersedia
        </p>
      </div>

      <figcaption className="plan-caption">
        <span className="plan-key plan-key--open">Tersedia</span>
        <span className="plan-key plan-key--taken">Terisi</span>
        <span className="plan-key plan-key--picked">Dipilih</span>
        <span className="plan-caption-note">Contoh denah, klik booth untuk memilih</span>
      </figcaption>
    </figure>
  );
}
