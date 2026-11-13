"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { setActiveOrganizerEventId } from "@/app/lib/event-defaults";
import { getEvent, listOrganizerEvents } from "@/app/lib/db";
import { useAuth } from "@/app/components/AuthContext";

function QRCodeContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "";
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState<string>("");
  const [allEvents, setAllEvents] = useState<Array<{ id: string; title: string }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const eventPath = `/events/${eventId}/guide`;
  const [eventUrl, setEventUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    setActiveOrganizerEventId(eventId);
    if (user?.id) {
      listOrganizerEvents(user.id)
        .then((list) => {
          if (!cancelled) setAllEvents(list.map((e) => ({ id: e.id, title: e.title })));
        })
        .catch(() => {});
    }
    getEvent(eventId)
      .then((meta) => {
        if (cancelled || !meta) return;
        setEventTitle(meta.title);
        setEventDate(meta.date);
        setEventStatus(meta.status || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId, user?.id]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-foreground/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">QR Code Event</h1>
          </div>
          <p className="text-sm text-primary-light font-medium">
            {eventTitle} <span className="text-muted-foreground text-xs font-normal">({eventDate})</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Ganti Acara:</span>
            <select
              value={eventId}
              onChange={(e) => {
                setActiveOrganizerEventId(e.target.value);
                router.push(`/dashboard/organizer/events/${e.target.value}/qr-code`);
              }}
              className="bg-card/90 border border-foreground/10 rounded-lg px-2 py-1 text-xs text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            >
              {allEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
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
            Buka Panduan Digital
          </Link>
        </div>
      </div>

      {eventStatus === "draft" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm" role="status">
          Event ini masih draft, jadi QR Code belum bisa dibuka pengunjung.{" "}
          <Link href={`/dashboard/organizer/events/${eventId}/floor-plan`} className="font-semibold text-primary-light hover:underline">Terbitkan dari halaman denah</Link>.
        </div>
      )}

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
            <span className="badge badge-primary">QR Code Scannable</span>
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
              {copied ? "Tersalin!" : "Salin"}
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

        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              Cara Penggunaan
            </h2>
            <ol className="space-y-4">
              {[
                { step: "1", title: "Download QR Code", desc: "Unduh file QR Code dalam format PNG resolusi tinggi atau SVG untuk cetakan besar." },
                { step: "2", title: "Cetak & Pasang", desc: "Cetak QR Code dan pasang di lokasi strategis venue acara — pintu masuk, meja informasi, dan setiap zona booth." },
                { step: "3", title: "Pengunjung Scan", desc: "Pengunjung cukup arahkan kamera HP ke QR Code — tanpa perlu download aplikasi. Langsung terbuka panduan digital." },
                { step: "4", title: "Akses Panduan Digital", desc: "Pengunjung bisa melihat denah interaktif, info booth, pesan makanan (F&B), dan baca brosur digital (Non-F&B)." },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-secondary text-sm font-bold flex-shrink-0">
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

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Tips:</strong> Pasang QR Code minimal ukuran 5×5 cm agar mudah di-scan dari jarak 30cm.
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
