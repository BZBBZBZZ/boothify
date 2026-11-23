"use client";

import { useState } from "react";

/** Facilities organizers most often state for a bazaar booth. They can add their own too. */
export const FACILITY_PRESETS = [
  "Meja",
  "Kursi",
  "Listrik",
  "Stop kontak",
  "Lampu booth",
  "Tenda / kanopi",
  "Papan nama booth",
  "Akses air bersih",
  "Wi-Fi",
  "Tempat sampah",
  "Keamanan malam",
  "Parkir tenant",
];

export type Facilities = { included: string[]; excluded: string[] };

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
);
const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

/* ------------------------------------------------------------------ display */

/** What the booth rent includes and what tenants must bring themselves. */
export function FacilityList({ included = [], excluded = [], compact = false }: { included?: string[]; excluded?: string[]; compact?: boolean }) {
  if (included.length === 0 && excluded.length === 0) {
    return (
      <p className="facility-empty">
        Organizer belum mencantumkan fasilitas booth. Tanyakan langsung ke organizer sebelum menyewa.
      </p>
    );
  }
  return (
    <div className={compact ? "grid gap-3" : "facility-grid"}>
      <div className="facility-col facility-col--yes">
        <h3 className="facility-col-title"><Check /> Disediakan organizer</h3>
        {included.length > 0 ? (
          <ul className="facility-list">
            {included.map((item) => <li key={item}><Check /> {item}</li>)}
          </ul>
        ) : (
          <p className="facility-empty">Tidak ada fasilitas yang dicantumkan.</p>
        )}
      </div>
      <div className="facility-col facility-col--no">
        <h3 className="facility-col-title"><Cross /> Tidak disediakan (bawa sendiri)</h3>
        {excluded.length > 0 ? (
          <ul className="facility-list">
            {excluded.map((item) => <li key={item}><Cross /> {item}</li>)}
          </ul>
        ) : (
          <p className="facility-empty">Tidak ada yang dicantumkan.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- editor */

type Choice = "yes" | "no" | "";

/**
 * Lets an organizer mark each facility as provided, not provided, or leave it out.
 * Preset names can be detailed (e.g. "Listrik 900 watt") by adding a custom item.
 */
export function FacilityPicker({ value, onChange }: { value: Facilities; onChange: (next: Facilities) => void }) {
  const [custom, setCustom] = useState("");
  const all = Array.from(new Set([...FACILITY_PRESETS, ...value.included, ...value.excluded]));

  const choiceOf = (item: string): Choice => (value.included.includes(item) ? "yes" : value.excluded.includes(item) ? "no" : "");

  const setChoice = (item: string, choice: Choice) => {
    const included = value.included.filter((x) => x !== item);
    const excluded = value.excluded.filter((x) => x !== item);
    if (choice === "yes") included.push(item);
    if (choice === "no") excluded.push(item);
    onChange({ included, excluded });
  };

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (choiceOf(name) === "") setChoice(name, "yes");
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <div className="facility-picker" role="group" aria-label="Fasilitas booth">
        {all.map((item) => {
          const choice = choiceOf(item);
          return (
            <div key={item} className="facility-picker-row">
              <span className={choice ? "font-medium" : "text-muted-foreground"}>{item}</span>
              <div className="segmented" role="group" aria-label={`Status ${item}`}>
                <button type="button" data-tone="yes" aria-pressed={choice === "yes"} onClick={() => setChoice(item, choice === "yes" ? "" : "yes")}>
                  Disediakan
                </button>
                <button type="button" data-tone="no" aria-pressed={choice === "no"} onClick={() => setChoice(item, choice === "no" ? "" : "no")}>
                  Tidak
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <label htmlFor="facility-custom" className="visually-hidden">Fasilitas lain</label>
        <input
          id="facility-custom"
          type="text"
          className="input-base"
          placeholder="Tambah fasilitas lain, contoh: Listrik 900 watt"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn btn-secondary" onClick={addCustom} disabled={!custom.trim()}>
          Tambah
        </button>
      </div>
      <p className="field-hint">
        Klik <strong>Disediakan</strong> atau <strong>Tidak</strong> untuk setiap fasilitas. Fasilitas yang tidak dipilih tidak ditampilkan ke tenant.
      </p>
    </div>
  );
}
