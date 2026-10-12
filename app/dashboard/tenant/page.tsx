"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type BookingItem = {
  event: string;
  booth: string;
  date: string;
  status: string;
  payment: string;
  eventId?: string;
  price?: number;
};

type VisitorOrderItem = {
  id: string;
  eventId?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  customer: string;
  phone?: string;
  method: string;
  time: string;
};

const DEFAULT_BOOKINGS: BookingItem[] = [
  { event: "Green Fashion Expo 2026", booth: "A1", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1" },
  { event: "Green Fashion Expo 2026", booth: "A2", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1" },
  { event: "Eco Market Bandung", booth: "C2", date: "20–22 Des 2026", status: "confirmed", payment: "pending", eventId: "2" },
];

const RECOMMENDED_EVENTS = [
  { id: "3", title: "EduTech Innovation Fair", date: "1–3 Des 2026", location: "Surabaya", match: "92%", reason: "Cocok dengan kategori Education" },
  { id: "6", title: "Sustainable Living Expo", date: "5–7 Jan 2027", location: "Bali", match: "87%", reason: "Relevan dengan produk ramah lingkungan" },
];

export default function TenantDashboard() {
  const [bookings, setBookings] = useState<BookingItem[]>(DEFAULT_BOOKINGS);
  const [orderCount, setOrderCount] = useState("124");
  const [visitorOrders, setVisitorOrders] = useState<VisitorOrderItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_tenant_bookings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBookings(parsed);
        }
      }

      const storedOrders = localStorage.getItem("boothify_visitor_orders");
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        if (Array.isArray(parsedOrders)) {
          setVisitorOrders(parsedOrders);
        }
      }

      const count = localStorage.getItem("boothify_tenant_order_count");
      if (count) {
        setOrderCount(count);
      }
    } catch {
      // ignore
    }
  }, []);

  const uniqueEventsCount = new Set(bookings.map((b) => b.event)).size;

  return (
    <div className="animate-fade-in" id="tenant-overview">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Tenant</h1>
        <p className="text-muted-foreground text-sm">Kelola booth, produk, dan pantau pesanan kamu secara real-time.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📅</span>
            <span className="text-[11px] text-secondary-light font-medium">Aktif sekarang</span>
          </div>
          <div className="text-2xl font-bold mb-1">{uniqueEventsCount}</div>
          <div className="text-xs text-muted-foreground">Event Terdaftar</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] text-secondary-light font-medium">Di {uniqueEventsCount} event</span>
          </div>
          <div className="text-2xl font-bold mb-1">{bookings.length}</div>
          <div className="text-xs text-muted-foreground">Booth Aktif</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💳</span>
            <span className="text-[11px] text-secondary-light font-medium">Bulan ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {(bookings.length * 2.5).toFixed(1)} Jt
          </div>
          <div className="text-xs text-muted-foreground">Total Investasi Booth</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📦</span>
            <span className="text-[11px] text-secondary-light font-medium">Live dari pengunjung</span>
          </div>
          <div className="text-2xl font-bold mb-1">{orderCount}</div>
          <div className="text-xs text-muted-foreground">Pesanan Masuk</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Bookings & Incoming Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Bookings */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Booth Saya</h2>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/tenant/catalog" className="btn btn-secondary btn-sm">
                  Kelola Menu & Web
                </Link>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari Event Baru
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {bookings.map((booking, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition border border-white/[0.03]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-sm">
                      {booking.booth}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{booking.event}</h3>
                      <p className="text-xs text-muted-foreground">{booking.date} • Booth {booking.booth}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge text-[10px] ${booking.payment === "paid" ? "badge-primary" : "badge-accent"}`}>
                      {booking.payment === "paid" ? "✓ Lunas" : "⏳ Pending"}
                    </span>
                    <Link
                      href={`/events/${booking.eventId || "1"}/guide`}
                      className="btn btn-ghost btn-sm text-xs text-primary-light"
                      title="Lihat tampilan booth di Denah Pengunjung"
                    >
                      Buka Denah ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incoming Orders from Visitors */}
          {visitorOrders.length > 0 && (
            <div className="card-base p-6 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="font-semibold text-foreground">Pesanan Masuk dari Pengunjung (Live)</h2>
                </div>
                <span className="badge badge-primary text-[10px]">{visitorOrders.length} Pesanan</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Pesanan yang dibuat oleh pengunjung melalui scan QR Code / Digital Guide di booth kamu.
              </p>
              <div className="space-y-3">
                {visitorOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-primary-light">{order.id}</span>
                        <span className="badge badge-secondary text-[9px]">{order.method}</span>
                        <span className="text-[10px] text-muted-foreground">{order.time}</span>
                      </div>
                      <p className="font-medium text-foreground mt-1">
                        {order.customer} {order.phone && <span className="text-muted-foreground font-normal">({order.phone})</span>}
                      </p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        {order.items.map((it) => `${it.qty}x ${it.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="font-bold text-foreground text-sm">
                        Rp {order.total.toLocaleString("id-ID")}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-medium">✓ Siap Disajikan</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Recommended Events */}
        <div>
          <div className="card-base p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              Rekomendasi AI
              <span className="badge badge-secondary text-[10px]">✨ SMART</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Event yang cocok dengan profil produk kamu</p>
            <div className="space-y-3">
              {RECOMMENDED_EVENTS.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <span className="text-xs font-bold text-primary-light">{event.match}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{event.date} • {event.location}</p>
                  <p className="text-[11px] text-secondary-light">💡 {event.reason}</p>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Rekomendasi berdasarkan AI matching — template UI untuk integrasi Gemini API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

