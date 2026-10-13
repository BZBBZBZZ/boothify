"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {
  getEventMeta,
  getAllOrganizerEvents,
  setActiveOrganizerEventId,
} from "@/app/lib/event-defaults";
import { useAuth } from "@/app/components/AuthContext";

function QRCodeContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showLogo, setShowLogo] = useState(true);
  const [showEventInfo, setShowEventInfo] = useState(true);
  const [printSize, setPrintSize] = useState("A4");
  const [eventTitle, setEventTitle] = useState("Green Fashion Expo 2026");
  const [eventDate, setEventDate] = useState("15–17 November 2026");
  const [allEvents, setAllEvents] = useState<Array<{ id: string; title: string }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const eventPath = `/events/${eventId}/guide`;
  const [eventUrl, setEventUrl] = useState("");

  useEffect(() => {
    try {
      setActiveOrganizerEventId(eventId);
      const meta = getEventMeta(eventId);
      setEventTitle(meta.title);
      if (meta.date) setEventDate(meta.date);
      setAllEvents(getAllOrganizerEvents(user?.email));
    } catch { /* ignore */ }
  }, [eventId, user?.email]);

  useEffect(() => {
    // Set URL based on actual origin (works with port forwarding)
    setEventUrl(window.location.origin + eventPath);
  }, [eventPath]);

  useEffect(() => {
    if (!eventUrl) return;

    // Generate QR code as data URL for display
    QRCode.toDataURL(eventUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(console.error);

    // Also render to canvas for download
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, eventUrl, {
        width: 1024,
        margin: 3,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      }).catch(console.error);
    }
  }, [eventUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const slug = eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const link = document.createElement("a");
    link.download = `boothify-qr-${eventId}-${slug}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const downloadSVG = () => {
    if (!eventUrl) return;
    const slug = eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    QRCode.toString(eventUrl, {
      type: "svg",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
    }).then((svgString) => {
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const link = document.createElement("a");
      link.download = `boothify-qr-${eventId}-${slug}.svg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }).catch(console.error);
  };

  return (
    <div className="animate-fade-in" id="qr-code-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">QR Code Event</h1>
            <span className="badge badge-primary text-xs">Event #{eventId}</span>
          </div>
          <p className="text-sm text-primary-light font-medium">
            🎯 {eventTitle} <span className="text-muted-foreground text-xs font-normal">({eventDate})</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Ganti Acara:</span>
            <select
              value={eventId}
              onChange={(e) => {
                setActiveOrganizerEventId(e.target.value);
                router.push(`/dashboard/organizer/events/${e.target.value}/qr-code`);
              }}
              className="bg-card/90 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} (ID #{ev.id})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/events/${eventId}/guide`}
            target="_blank"
            className="btn btn-secondary btn-sm text-xs"
          >
            📱 Buka Panduan Digital ↗
          </Link>
        </div>
      </div>

      {/* Hidden canvas for high-res download */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Preview */}
        <div className="card-base p-8 text-center">
          <h2 className="font-semibold text-lg mb-1">{eventTitle}</h2>
          <p className="text-xs text-muted-foreground mb-6">{eventDate}</p>

          {/* Real QR Code */}
          <div className="inline-block p-6 bg-white rounded-2xl mb-6 shadow-lg">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code untuk ${eventTitle}`}
                className="w-56 h-56"
                id="qr-code-image"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <svg className="animate-spin text-gray-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              </div>
            )}
          </div>

          <div className="mb-2">
            <span className="badge badge-primary">✅ QR Code Scannable</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Scan QR Code ini untuk membuka panduan event digital
          </p>

          {/* URL */}
          <div className="flex items-center gap-2 max-w-sm mx-auto mb-6">
            <input
              type="text"
              className="input-base text-xs text-center"
              value={eventUrl}
              readOnly
            />
            <button
              onClick={handleCopy}
              className="btn btn-secondary btn-sm whitespace-nowrap"
              id="copy-url-btn"
            >
              {copied ? "✓ Tersalin!" : "Salin"}
            </button>
          </div>

          {/* Download buttons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button onClick={downloadPNG} className="btn btn-primary" id="download-qr-png">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </button>
            <button onClick={downloadSVG} className="btn btn-secondary" id="download-qr-svg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download SVG
            </button>
          </div>

          {/* Direct Role Test Buttons */}
          <div className="border-t border-border pt-5 space-y-2 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              🧪 Uji Coba Alur Langsung (Demo Flow):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/events/${eventId}/guide`}
                className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                id="test-visitor-flow"
              >
                📱 Uji sbg Pengunjung (Scan)
              </Link>
              <Link
                href={`/events/${eventId}`}
                className="btn btn-secondary text-xs flex items-center justify-center gap-2 py-2 border-primary/30 text-primary-light hover:bg-primary/10"
                id="test-tenant-flow"
              >
                🏪 Uji sbg Tenant (Sewa Booth)
              </Link>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              📋 Cara Penggunaan
            </h2>
            <ol className="space-y-4">
              {[
                { step: "1", title: "Download QR Code", desc: "Unduh file QR Code dalam format PNG resolusi tinggi atau SVG untuk cetakan besar." },
                { step: "2", title: "Cetak & Pasang", desc: "Cetak QR Code dan pasang di lokasi strategis venue acara — pintu masuk, meja informasi, dan setiap zona booth." },
                { step: "3", title: "Pengunjung Scan", desc: "Pengunjung cukup arahkan kamera HP ke QR Code — tanpa perlu download aplikasi. Langsung terbuka panduan digital." },
                { step: "4", title: "Akses Panduan Digital", desc: "Pengunjung bisa melihat denah interaktif, info booth, pesan makanan (F&B), dan baca brosur digital (Non-F&B)." },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card-base p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              ⚙️ Pengaturan QR Code
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ukuran Cetak</label>
                <select className="input-base" id="qr-print-size" value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
                  <option>A4 (210 × 297 mm)</option>
                  <option>A3 (297 × 420 mm)</option>
                  <option>A5 (148 × 210 mm)</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tampilkan Logo di Tengah</p>
                  <p className="text-xs text-muted-foreground">Logo Boothify di center QR Code</p>
                </div>
                <button
                  onClick={() => setShowLogo(!showLogo)}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${showLogo ? "bg-primary/50" : "bg-white/10"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showLogo ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sertakan Info Event</p>
                  <p className="text-xs text-muted-foreground">Tampilkan nama & tanggal di bawah QR</p>
                </div>
                <button
                  onClick={() => setShowEventInfo(!showEventInfo)}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${showEventInfo ? "bg-primary/50" : "bg-white/10"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showEventInfo ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tips:</strong> Pasang QR Code minimal ukuran 5×5 cm agar mudah di-scan dari jarak 30cm.
              Untuk banner besar, gunakan ukuran A3 atau lebih. URL QR otomatis mengikuti domain kamu (termasuk port forwarding).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat QR Code...</div>}>
      <QRCodeContent />
    </Suspense>
  );
}
