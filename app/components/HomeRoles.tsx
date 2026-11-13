"use client";

import { useState } from "react";
import Image from "next/image";

type Role = "organizer" | "tenant" | "pengunjung";

const ROLES: {
  key: Role;
  label: string;
  features: { title: string; description: string }[];
  shot: { src: string; alt: string; width: number; height: number; kind: "wide" | "phone" };
  caption: string;
}[] = [
  {
    key: "organizer",
    label: "Organizer",
    features: [
      { title: "Interactive Floor Plan", description: "Denah drag & drop, zona booth, ketersediaan real-time." },
      { title: "Ide Campaign", description: "Susun tema campaign dan simpan langsung ke event." },
    ],
    shot: {
      src: "/images/screens/organizer-dashboard-v2.png",
      alt: "Dashboard organizer Boothify dengan ringkasan event dan pendaftaran booth",
      width: 1440,
      height: 900,
      kind: "wide",
    },
    caption: "Tampilan dashboard organizer",
  },
  {
    key: "tenant",
    label: "Tenant",
    features: [
      { title: "Smart Matching", description: "Mencocokkan produk brand dengan event paling relevan." },
      { title: "Pembayaran Langsung", description: "QRIS, e-wallet, transfer bank dan kartu kredit." },
      { title: "Katalog Digital & Menu", description: "Menu F&B untuk self-ordering; brosur, galeri dan video." },
    ],
    shot: {
      src: "/images/screens/booth-picker-v2.png",
      alt: "Halaman event Boothify, tab Pilih Booth dengan denah dan ringkasan sewa",
      width: 1216,
      height: 864,
      kind: "wide",
    },
    caption: "Halaman pilih booth di sebuah event",
  },
  {
    key: "pengunjung",
    label: "Pengunjung",
    features: [
      { title: "QR Code Event Guide", description: "Satu QR per event. Pengunjung scan tanpa download aplikasi." },
    ],
    shot: {
      src: "/images/screens/guide-phone-v2.png",
      alt: "Panduan digital event Boothify di layar HP pengunjung",
      width: 390,
      height: 844,
      kind: "phone",
    },
    caption: "Yang dilihat pengunjung setelah scan QR",
  },
];

/* A groove pressed into cotton, a card riding in it to the chosen role. */
export default function HomeRoles() {
  const [active, setActive] = useState<Role>("organizer");

  return (
    <div className="roles">
      <div className="roles-groove" role="tablist" aria-label="Fitur menurut peran">
        {ROLES.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            id={`roles-tab-${r.key}`}
            aria-selected={active === r.key}
            aria-controls={`roles-panel-${r.key}`}
            className="roles-stop"
            onClick={() => setActive(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {ROLES.map((r) => (
        <div
          key={r.key}
          role="tabpanel"
          id={`roles-panel-${r.key}`}
          aria-labelledby={`roles-tab-${r.key}`}
          hidden={active !== r.key}
          className={`roles-panel roles-panel--${r.shot.kind}`}
        >
          <figure className="roles-shot">
            <div
              className={`roles-shot-frame roles-shot-frame--${r.shot.kind}`}
              data-slot={`roles-${r.key}`}
              data-kind="product"
              data-alt={r.shot.alt}
            >
              <Image
                src={r.shot.src}
                alt={r.shot.alt}
                width={r.shot.width}
                height={r.shot.height}
                sizes={r.shot.kind === "phone" ? "300px" : "(max-width: 960px) 100vw, 60vw"}
              />
            </div>
            <figcaption>{r.caption}</figcaption>
          </figure>

          <dl className="roles-card">
            {r.features.map((f) => (
              <div key={f.title} className="roles-feature">
                <dt>{f.title}</dt>
                <dd>{f.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
