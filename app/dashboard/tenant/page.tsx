"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

type BookingItem = {
  event: string;
  booth: string;
  date: string;
  status: string;
  payment: string;
  eventId?: string;
  price?: number;
  tenantEmail?: string;
};

type VisitorOrderItem = {
  id: string;
  eventId?: string;
  event?: string;
  booth?: string;
  items: { boothId?: string; name: string; qty: number; price: number }[];
  total: number;
  customer: string;
  phone?: string;
  method: string;
  time: string;
  status?: "pending" | "making" | "ready" | "done";
  tenantEmail?: string;
  tenantName?: string;
};

const DEFAULT_ORDERS: VisitorOrderItem[] = [
  {
    id: "BF-ORDER-9931",
    eventId: "1",
    event: "Green Fashion Expo 2026",
    booth: "A1",
    customer: "Rizky Pratama",
    phone: "081299887766",
    method: "QRIS",
    time: "5 menit lalu",
    total: 185000,
    status: "pending",
    tenantEmail: "demo-tenant@boothify.id",
    tenantName: "EcoWear Studio",
    items: [{ boothId: "A1", name: "Organic Cotton T-Shirt", qty: 1, price: 185000 }],
  },
  {
    id: "BF-ORDER-8821",
    eventId: "1",
    event: "Green Fashion Expo 2026",
    booth: "C1",
    customer: "Budi Santoso",
    phone: "081234567890",
    method: "QRIS",
    time: "15 menit lalu",
    total: 44000,
    status: "pending",
    tenantEmail: "kopi@boothify.id",
    tenantName: "Kopi Keliling Nusantara",
    items: [{ boothId: "C1", name: "Kopi Susu Gula Aren", qty: 2, price: 22000 }],
  },
  {
    id: "BF-ORDER-4512",
    eventId: "1",
    event: "Green Fashion Expo 2026",
    booth: "C1",
    customer: "Siti Rahma",
    phone: "085712345678",
    method: "GoPay",
    time: "25 menit lalu",
    total: 35000,
    status: "ready",
    tenantEmail: "kopi@boothify.id",
    tenantName: "Kopi Keliling Nusantara",
    items: [{ boothId: "C1", name: "Matcha Latte Oat", qty: 1, price: 35000 }],
  },
];

const DEMO_TENANT_BOOKINGS: Record<string, BookingItem[]> = {
  "demo-tenant@boothify.id": [
    { event: "Green Fashion Expo 2026", booth: "A1", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1", tenantEmail: "demo-tenant@boothify.id", price: 2500000 },
    { event: "Green Fashion Expo 2026", booth: "A2", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1", tenantEmail: "demo-tenant@boothify.id", price: 2500000 },
    { event: "Green Fashion Expo 2026", booth: "C3", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1", tenantEmail: "demo-tenant@boothify.id", price: 1800000 },
  ],
  "kopi@boothify.id": [
    { event: "Green Fashion Expo 2026", booth: "C1", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1", tenantEmail: "kopi@boothify.id", price: 3000000 },
    { event: "Green Fashion Expo 2026", booth: "B1", date: "15–17 Nov 2026", status: "confirmed", payment: "paid", eventId: "1", tenantEmail: "kopi@boothify.id", price: 2500000 },
    { event: "Indonesia Food Festival 2026", booth: "F2", date: "22–24 Nov 2026", status: "confirmed", payment: "paid", eventId: "2", tenantEmail: "kopi@boothify.id", price: 3000000 },
  ],
};

const RECOMMENDED_EVENTS = [
  { id: "3", title: "EduTech Innovation Fair", date: "1–3 Des 2026", location: "Surabaya", match: "92%", reason: "Cocok dengan kategori Education" },
  { id: "6", title: "Sustainable Living Expo", date: "5–7 Jan 2027", location: "Bali", match: "87%", reason: "Relevan dengan produk ramah lingkungan" },
];

export default function TenantDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [visitorOrders, setVisitorOrders] = useState<VisitorOrderItem[]>([]);

  useEffect(() => {
    try {
      const email = user?.email || "demo-tenant@boothify.id";
      const isEcoWear = email === "demo-tenant@boothify.id" || email === "tenant@boothify.id";
      const isKopi = email === "kopi@boothify.id";

      const initialDemo = DEMO_TENANT_BOOKINGS[email] || (isEcoWear ? DEMO_TENANT_BOOKINGS["demo-tenant@boothify.id"] : []);

      const stored = localStorage.getItem("boothify_tenant_bookings");
      let allBookings: BookingItem[] = [];
      if (stored) {
        allBookings = JSON.parse(stored);
      }

      // Filter bookings matching this specific tenant
      const userBookings = allBookings.filter((b) => b.tenantEmail === email);

      const activeBookings = userBookings.length > 0 ? userBookings : initialDemo;
      setBookings(activeBookings);
      const bookedBoothIds = activeBookings.map((b) => b.booth);

      // Load visitor orders scoped to this tenant
      const storedOrders = localStorage.getItem("boothify_visitor_orders");
      let allOrders: VisitorOrderItem[] = [];
      if (storedOrders) {
        try {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let wasRepaired = false;
            allOrders = parsed.map((o: VisitorOrderItem) => {
              const hasBrokenItems = !Array.isArray(o.items) || o.items.length === 0;
              const hasBrokenTotal = (o.total || 0) <= 0;
              const hasBrokenEvent = !o.event || o.event.length <= 2;

              if (hasBrokenItems || hasBrokenTotal || hasBrokenEvent) {
                wasRepaired = true;
                const isKopiOrder = o.booth === "C1" || o.booth === "B1" || o.booth === "F2" || (o.tenantEmail && o.tenantEmail.includes("kopi"));
                const repairedItems = !hasBrokenItems
                  ? o.items
                  : isKopiOrder
                  ? [
                      { boothId: o.booth || "C1", name: "Kopi Susu Gula Aren", qty: 2, price: 22000 },
                      { boothId: o.booth || "C1", name: "Butter Croissant", qty: 1, price: 18000 },
                    ]
                  : [
                      { boothId: o.booth || "A1", name: "Organic Cotton T-Shirt", qty: 1, price: 185000 },
                    ];
                const calculatedTotal = repairedItems.reduce((s, it) => s + it.price * it.qty, 0);

                return {
                  ...o,
                  event: hasBrokenEvent ? "Green Fashion Expo 2026" : o.event,
                  items: repairedItems,
                  total: hasBrokenTotal ? calculatedTotal : o.total,
                  tenantName: o.tenantName || (isKopiOrder ? "Kopi Keliling Nusantara" : "EcoWear Studio"),
                  tenantEmail: o.tenantEmail || (isKopiOrder ? "kopi@boothify.id" : "demo-tenant@boothify.id"),
                };
              }
              return o;
            });

            if (wasRepaired) {
              localStorage.setItem("boothify_visitor_orders", JSON.stringify(allOrders));
            }
          }
        } catch {
          allOrders = [];
        }
      }
      if (allOrders.length === 0) {
        allOrders = DEFAULT_ORDERS;
        localStorage.setItem("boothify_visitor_orders", JSON.stringify(DEFAULT_ORDERS));
      }

      // Robust matching: by email, booth ID, business name, or demo keywords
      const tenantOrders = allOrders.filter((o) => {
        // 1. Direct tenant email match
        if (o.tenantEmail && (o.tenantEmail.toLowerCase() === email.toLowerCase() || (isEcoWear && o.tenantEmail === "demo-tenant@boothify.id"))) {
          return true;
        }
        // 2. Direct booth match from current bookings
        if (o.booth && bookedBoothIds.includes(o.booth)) {
          return true;
        }
        if (o.items && o.items.some((i) => Boolean(i.boothId && bookedBoothIds.includes(i.boothId)))) {
          return true;
        }
        // 3. Business name match
        if (user?.businessName && o.tenantName && o.tenantName.toLowerCase() === user.businessName.toLowerCase()) {
          return true;
        }
        // 4. Fallback for demo tenant accounts
        if (isEcoWear) {
          if (o.booth === "A1" || o.booth === "A2") return true;
          if (
            o.items?.some(
              (i) =>
                i.boothId === "A1" ||
                i.boothId === "A2" ||
                i.name.toLowerCase().includes("t-shirt") ||
                i.name.toLowerCase().includes("outer") ||
                i.name.toLowerCase().includes("denim") ||
                i.name.toLowerCase().includes("totebag") ||
                i.name.toLowerCase().includes("ecowear")
            )
          ) {
            return true;
          }
        }
        if (isKopi) {
          if (o.booth === "C1") return true;
          if (
            o.items?.some(
              (i) =>
                i.boothId === "C1" ||
                i.name.toLowerCase().includes("kopi") ||
                i.name.toLowerCase().includes("matcha") ||
                i.name.toLowerCase().includes("croissant")
            )
          ) {
            return true;
          }
        }
        return false;
      });

      setVisitorOrders(tenantOrders);
    } catch {
      // ignore
    }
  }, [user]);

  const uniqueEventsCount = new Set(bookings.map((b) => b.event)).size;

  const updateOrderStatus = (orderId: string, newStatus: "pending" | "making" | "ready" | "done") => {
    setVisitorOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const raw = localStorage.getItem("boothify_visitor_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map((o: VisitorOrderItem) => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem("boothify_visitor_orders", JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }
  };

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
          <div className="text-2xl font-bold mb-1">{visitorOrders.length}</div>
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
                  Kelola Menu &amp; Web
                </Link>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari Event Baru
                </Link>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-xl p-6">
                <span className="text-3xl block mb-2">🏪</span>
                <p className="font-semibold text-foreground mb-1">Belum Ada Booth yang Disewa</p>
                <p className="text-xs mb-4">Akun brand ini belum memiliki sewa booth aktif. Jelajahi event yang cocok untuk brand kamu.</p>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari &amp; Sewa Booth Sekarang →
                </Link>
              </div>
            ) : (
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
            )}
          </div>

          {/* Incoming Orders from Visitors */}
          <div className="card-base p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-semibold text-foreground">Pesanan Masuk dari Pengunjung (Live)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary text-[10px]">{visitorOrders.length} Pesanan</span>
                <Link href="/dashboard/tenant/bookings" className="btn btn-ghost btn-sm text-[11px] text-primary-light">
                  Buka KDS Penuh →
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pesanan yang dibuat oleh pengunjung melalui scan QR Code / Digital Guide di booth kamu. Ubah status pesanan secara real-time.
            </p>

            {visitorOrders.length === 0 ? (
              <div className="p-6 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                <span className="text-3xl block mb-2">📋</span>
                <p className="font-semibold text-xs text-foreground mb-1">Belum Ada Pesanan Masuk</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Saat pengunjung memindai QR Code di booth kamu atau memesan produk via Panduan Digital, pesanan baru akan langsung masuk ke sini secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitorOrders.slice(0, 5).map((order) => {
                  const status = order.status || "pending";
                  const boothLabel = order.booth || order.items[0]?.boothId || "A1";
                  return (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                        status === "making"
                          ? "bg-sky-500/[0.04] border-sky-500/30"
                          : status === "ready"
                          ? "bg-emerald-500/[0.04] border-emerald-500/40"
                          : status === "done"
                          ? "bg-white/[0.01] border-white/5 opacity-70"
                          : "bg-amber-500/[0.03] border-amber-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-mono text-primary-light">{order.id}</span>
                          <span className="badge badge-secondary text-[10px] font-semibold">
                            🏪 Booth {boothLabel}
                          </span>
                          <span className="badge badge-secondary text-[9px]">{order.method}</span>
                          <span className="text-[10px] text-muted-foreground">{order.time}</span>
                          {status === "pending" && (
                            <span className="badge text-[9px] bg-amber-500/15 text-amber-400">🟡 Baru Masuk</span>
                          )}
                          {status === "making" && (
                            <span className="badge text-[9px] bg-sky-500/15 text-sky-400 animate-pulse">🔵 Sedang Dibuat</span>
                          )}
                          {status === "ready" && (
                            <span className="badge text-[9px] bg-emerald-500/15 text-emerald-400">🟢 Siap Diambil</span>
                          )}
                          {status === "done" && (
                            <span className="badge text-[9px] bg-white/10 text-muted-foreground">✅ Selesai</span>
                          )}
                        </div>
                        <p className="font-medium text-foreground mt-1">
                          {order.customer} {order.phone && <span className="text-muted-foreground font-normal">({order.phone})</span>}
                        </p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          {order.items && order.items.length > 0
                            ? order.items.map((it) => `${it.qty}x ${it.name}`).join(", ")
                            : "1x Produk Tenant"}
                        </p>
                      </div>
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <span className="font-bold text-foreground text-sm">
                          Rp {(order.total || 185000).toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {status === "pending" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "making")}
                              className="btn btn-primary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-make-${order.id}`}
                            >
                              🍳 Buat
                            </button>
                          )}
                          {status === "making" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "ready")}
                              className="btn btn-sm text-[11px] py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                              id={`dash-ready-${order.id}`}
                            >
                              🔔 Siap
                            </button>
                          )}
                          {status === "ready" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "done")}
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-done-${order.id}`}
                            >
                              ✓ Selesai
                            </button>
                          )}
                          {status === "done" && (
                            <span className="text-muted-foreground text-[11px]">Selesai</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

