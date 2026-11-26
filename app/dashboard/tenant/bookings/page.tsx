"use client";

<<<<<<< Updated upstream
import { useState, useEffect } from "react";
=======
>>>>>>> Stashed changes
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../../components/AuthContext";

export type OrderStatus = "pending" | "making" | "ready" | "done";

export type VisitorOrder = {
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
  status?: OrderStatus;
  tenantEmail?: string;
  tenantName?: string;
};

export type BookingItem = {
  event: string;
  booth: string;
  date: string;
  status: string;
  payment: string;
  eventId?: string;
  price?: number;
  tenantEmail?: string;
};

import {
<<<<<<< Updated upstream
  getTenantBookingsFromSupabase,
  getVisitorOrdersFromSupabase,
} from "@/app/lib/supabase-service";
=======
  listTenantBookings,
  listTenantOrders,
  listPublishedEvents,
  getTenantMenu,
  updateOrderStatus as saveOrderStatus,
  errorMessage,
  type Booking,
  type VisitorOrder,
  type OrderStatus,
} from "@/app/lib/db";
import { calculateEventTenantMatch, tenantProfileFromUser } from "@/app/lib/tenant-match";
import { isUpcomingEvent } from "@/app/lib/tenant-events";
import { loadTenantEventOptions } from "@/app/lib/tenant-active-event";
import Icon from "../../../components/Icon";
import OnboardingGuide from "../../../components/OnboardingGuide";
import { Notice, PageHeader, PaymentBadge } from "../../../components/ui";
import CategoryPopover from "../../../components/CategoryPopover";

type OrderView = VisitorOrder & { time: string };

/** One product at one event, matched with what visitors ordered. */
type SalesRow = {
  key: string;
  eventId: string;
  event: string;
  product: string;
  price: number;
  stock: number | null;
  sold: number;
  revenue: number;
  inMenu: boolean;
};

const productKey = (eventId: string, name: string) => `${eventId}::${name.trim().toLowerCase()}`;

/**
 * Matches each event's menu with the paid orders from that event, so the dashboard shows
 * what is on sale next to what was ordered. Ordered products no longer in the menu still appear.
 */
function buildSalesRows(menus: Array<{ eventId: string; event: string; items: Array<{ name: string; price: number | string; stock?: number | string }> }>, paidOrders: VisitorOrder[]): SalesRow[] {
  const rows = new Map<string, SalesRow>();
  menus.forEach((m) =>
    m.items.forEach((item) => {
      if (!item.name) return;
      rows.set(productKey(m.eventId, item.name), {
        key: productKey(m.eventId, item.name),
        eventId: m.eventId,
        event: m.event,
        product: item.name,
        price: Number(item.price) || 0,
        stock: item.stock === undefined || item.stock === "" ? null : Number(item.stock) || 0,
        sold: 0,
        revenue: 0,
        inMenu: true,
      });
    })
  );
  paidOrders.forEach((order) =>
    (order.items || []).forEach((it) => {
      const key = productKey(order.eventId, it.name);
      const row =
        rows.get(key) ||
        { key, eventId: order.eventId, event: order.event, product: it.name, price: Number(it.price) || 0, stock: null, sold: 0, revenue: 0, inMenu: false };
      row.sold += Number(it.qty) || 0;
      row.revenue += (Number(it.qty) || 0) * (Number(it.price) || 0);
      rows.set(key, row);
    })
  );
  // Grouped by event, best sellers first
  return Array.from(rows.values()).sort((a, b) => a.event.localeCompare(b.event) || b.sold - a.sold || a.product.localeCompare(b.product));
}

const orderTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
>>>>>>> Stashed changes

export default function TenantDashboard() {
  const { user } = useAuth();
<<<<<<< Updated upstream
  const [activeTab, setActiveTab] = useState<"orders" | "booths">("orders");
  const [orders, setOrders] = useState<VisitorOrder[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedPass, setSelectedPass] = useState<BookingItem | null>(null);
=======
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visitorOrders, setVisitorOrders] = useState<OrderView[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Array<{ id: string; title: string; date: string; location: string; match: string; categories?: string[]; category?: string }>>([]);
  const [loadError, setLoadError] = useState("");
  // Menu of every event this tenant joins; the dashboard covers all events at once
  const [menus, setMenus] = useState<Array<{ eventId: string; event: string; items: Array<{ name: string; price: number | string; stock?: number | string }> }>>([]);

  useEffect(() => {
    const tenantId = user?.id || "";
    if (!tenantId || user?.role !== "tenant") return;
    let cancelled = false;
    loadTenantEventOptions(tenantId)
      .then((events) =>
        Promise.all(
          events.map((e) =>
            getTenantMenu(tenantId, e.id)
              .then((items) => ({ eventId: e.id, event: e.title, items }))
              .catch(() => ({ eventId: e.id, event: e.title, items: [] }))
          )
        )
      )
      .then((list) => {
        if (!cancelled) setMenus(list);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [user]);
>>>>>>> Stashed changes

  // Load from localStorage scoped to user
  useEffect(() => {
    const email = user?.email || "demo-tenant@boothify.id";

<<<<<<< Updated upstream
    // 1. Load tenant bookings from Supabase
    getTenantBookingsFromSupabase(email).then((supabaseBookings) => {
      if (supabaseBookings && supabaseBookings.length > 0) {
        const mapped: BookingItem[] = supabaseBookings.map((b) => ({
          event: b.event,
          booth: b.booth,
          date: b.date || "2026",
          status: b.status || "confirmed",
          payment: b.payment || "paid",
          eventId: b.eventId,
          tenantEmail: b.tenantEmail,
          price: Number(b.amount?.replace(/\D/g, "") || 2500000),
        }));
        setBookings(mapped);
      } else {
        try {
          const stored = localStorage.getItem("boothify_tenant_bookings");
          if (stored) {
            const all = JSON.parse(stored);
            setBookings(all.filter((b: BookingItem) => b.tenantEmail === email));
          }
        } catch { /* ignore */ }
      }
    });

    // 2. Load visitor orders from Supabase
    getVisitorOrdersFromSupabase(email).then((supabaseOrders) => {
      if (supabaseOrders && supabaseOrders.length > 0) {
        setOrders(supabaseOrders.map((o) => ({
          ...o,
          status: (o.status as OrderStatus) || "pending",
          time: "Baru saja",
        })));
      } else {
        try {
          const stored = localStorage.getItem("boothify_visitor_orders");
          if (stored) {
            const parsed = JSON.parse(stored);
            setOrders(parsed);
          }
        } catch { /* ignore */ }
      }
    });
  }, [user]);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const raw = localStorage.getItem("boothify_visitor_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map((o: VisitorOrder) => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem("boothify_visitor_orders", JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o) => (o.status || "pending") === statusFilter);

  const pendingCount = orders.filter((o) => (o.status || "pending") === "pending").length;
  const makingCount = orders.filter((o) => o.status === "making").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const doneCount = orders.filter((o) => o.status === "done").length;

  return (
    <div className="animate-fade-in" id="tenant-orders-and-booths">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Pesanan Pengunjung &amp; Kelola Booth</h1>
          <p className="text-muted-foreground text-sm">
            Pantau antrean pesanan digital pengunjung dan kelola booth resmi brand kamu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/tenant/catalog" className="btn btn-secondary btn-sm">
            📦 Kelola Menu/Katalog
          </Link>
          <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
            + Cari Event Baru
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 font-semibold text-sm transition relative ${
            activeTab === "orders" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          id="tab-orders"
        >
          <span className="flex items-center gap-2">
            📦 Pesanan Masuk Pengunjung
            {orders.length > 0 && (
              <span className="badge badge-primary text-[10px]">{orders.length}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("booths")}
          className={`pb-3 px-4 font-semibold text-sm transition relative ${
            activeTab === "booths" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          id="tab-booths"
        >
          <span className="flex items-center gap-2">
            🏪 Booth Saya ({bookings.length})
          </span>
        </button>
      </div>

      {/* ========== TAB 1: VISITOR ORDERS MANAGER ========== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`btn btn-sm ${statusFilter === "pending" ? "btn-primary" : "btn-secondary"}`}
            >
              🟡 Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("making")}
              className={`btn btn-sm ${statusFilter === "making" ? "btn-primary" : "btn-secondary"}`}
            >
              🔵 Sedang Dibuat ({makingCount})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={`btn btn-sm ${statusFilter === "ready" ? "btn-primary" : "btn-secondary"}`}
            >
              🟢 Siap Diambil ({readyCount})
            </button>
            <button
              onClick={() => setStatusFilter("done")}
              className={`btn btn-sm ${statusFilter === "done" ? "btn-primary" : "btn-secondary"}`}
            >
              ✅ Selesai ({doneCount})
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="card-base p-12 text-center text-muted-foreground">
              <span className="text-4xl block mb-2">🍽️</span>
              <p className="font-semibold text-foreground mb-1">Belum ada pesanan pada status ini</p>
              <p className="text-xs">
                Pesanan yang dibuat oleh pengunjung melalui scan QR di booth kamu akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const currentStatus = order.status || "pending";

                return (
                  <div
                    key={order.id}
                    className={`card-base p-5 flex flex-col justify-between transition border ${
                      currentStatus === "making"
                        ? "border-sky-500/40 bg-sky-500/[0.03]"
                        : currentStatus === "ready"
                        ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                        : currentStatus === "done"
                        ? "border-white/5 opacity-70"
                        : "border-amber-500/30 bg-amber-500/[0.02]"
                    }`}
                    id={`order-card-${order.id}`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary-light">
                            {order.id}
                          </span>
                          <span className="badge badge-secondary text-[10px] font-semibold">
                            🏪 Booth {order.booth || order.items[0]?.boothId || "A1"}
                          </span>
                        </div>
                        {currentStatus === "pending" && (
                          <span className="badge text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            🟡 Baru Masuk
                          </span>
                        )}
                        {currentStatus === "making" && (
                          <span className="badge text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/30 animate-pulse">
                            🔵 Sedang Dibuat
                          </span>
                        )}
                        {currentStatus === "ready" && (
                          <span className="badge text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🟢 Siap Diambil
                          </span>
                        )}
                        {currentStatus === "done" && (
                          <span className="badge text-[10px] bg-white/10 text-muted-foreground border border-white/10">
                            ✅ Selesai
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="mb-3 pb-3 border-b border-white/5 text-xs">
                        <p className="font-semibold text-foreground text-sm">{order.customer}</p>
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                          {order.phone && <span>📱 {order.phone}</span>}
                          <span>• {order.method}</span>
                          <span>• {order.time}</span>
                        </div>
                        {order.event && (
                          <p className="text-[10px] text-primary-light font-medium mt-1">
                            📍 {order.event.length > 2 ? order.event : "Green Fashion Expo 2026"}
                          </p>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="space-y-1.5 mb-4 text-xs">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-foreground">
                                <strong>{item.qty}x</strong> {item.name}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                Rp {(item.price * item.qty).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>1x Menu / Produk Tenant</span>
                            <span className="text-[11px]">Rp {(order.total || 185000).toLocaleString("id-ID")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Total & Status Actions */}
                    <div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 mb-4 text-xs">
                        <span className="text-muted-foreground">Total Pembayaran:</span>
                        <span className="font-bold text-foreground text-sm">
                          Rp {(order.total || 185000).toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {currentStatus === "pending" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "making")}
                            className="btn btn-primary btn-sm w-full text-xs"
                            id={`btn-make-${order.id}`}
                          >
                            🍳 Mulai Buat (In Making)
                          </button>
                        )}
                        {currentStatus === "making" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="btn btn-sm w-full text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                            id={`btn-ready-${order.id}`}
                          >
                            🔔 Tandai Siap Diambil
                          </button>
                        )}
                        {currentStatus === "ready" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "done")}
                            className="btn btn-secondary btn-sm w-full text-xs"
                            id={`btn-done-${order.id}`}
                          >
                            ✓ Serahkan &amp; Selesai
                          </button>
                        )}
                        {currentStatus === "done" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="btn btn-ghost btn-sm w-full text-xs text-muted-foreground"
                          >
                            Kembalikan ke Siap
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
=======
    const loadOrders = () =>
      listTenantOrders(tenantId)
        .then((orders) => {
          if (!cancelled) setVisitorOrders(orders.map((o) => ({ ...o, time: orderTime(o.createdAt) })));
        })
        .catch(() => { });

    listTenantBookings(tenantId)
      .then((list) => {
        if (cancelled) return;
        setBookings(list);
        // Recommend upcoming events this tenant is not in yet, best match first
        const joined = new Set(list.map((b) => b.eventId));
        listPublishedEvents()
          .then((events) => {
            if (cancelled) return;
            const profile = tenantProfileFromUser(user);
            setRecommendedEvents(
              events
                .filter((e) => !joined.has(e.id) && isUpcomingEvent(e.date) && e.boothsTotal > e.boothsFilled)
                .map((e) => ({ e, score: calculateEventTenantMatch(e, profile).overallScore }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(({ e, score }) => ({
                  id: e.id,
                  title: e.title,
                  date: e.date,
                  location: e.location,
                  match: `${score}%`,
                  categories: e.categories,
                  category: e.category,
                }))
            );
          })
          .catch(() => { });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Data dashboard gagal dimuat."));
      });

    loadOrders();
    // New visitor orders show up without reloading the page
    const interval = window.setInterval(loadOrders, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  const uniqueEventsCount = new Set(bookings.map((b) => b.eventId)).size;
  // Only booths the server has confirmed as paid count as spending
  const totalSpent = bookings.filter((b) => b.payment === "paid").reduce((sum, b) => sum + b.total, 0);
  // The kitchen queue holds paid orders only; unpaid ones wait until the server confirms payment
  const paidOrders = visitorOrders.filter((o) => o.paymentStatus === "paid");
  const awaitingPaymentCount = visitorOrders.filter((o) => o.paymentStatus === "pending").length;
  const salesRows = buildSalesRows(menus, paidOrders);
  const salesRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const previous = visitorOrders;
    setVisitorOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      await saveOrderStatus(orderId, newStatus);
    } catch (err) {
      setVisitorOrders(previous);
      setLoadError(errorMessage(err, "Status pesanan gagal diubah."));
    }
  };

  return (
    <div className="animate-fade-in" id="tenant-overview">
      {loadError && <Notice tone="error" className="mb-6">{loadError}</Notice>}
      <PageHeader
        title="Dasbor Tenant"
        description="Ringkasan semua event kamu dalam satu tempat: booth, produk yang dijual, dan pesanan pengunjung."
        actions={<Link href="/dashboard/tenant/events" className="btn btn-primary">Cari event</Link>}
      />

      <OnboardingGuide
        userId={user?.id || ""}
        title="Mulai di sini"
        description="Empat langkah supaya booth kamu siap menerima pengunjung dan pesanan."
        steps={[
          {
            key: "profile",
            title: "Lengkapi profil usaha",
            text: "Kategori dan deskripsi dipakai untuk mencocokkan kamu dengan event yang sesuai.",
            href: "/dashboard/tenant/profile",
            cta: "Buka profil",
            done: Boolean(user?.businessCategory && user?.phone && user?.description),
          },
          {
            key: "booking",
            title: "Cari event dan sewa booth",
            text: "Cek fasilitas booth di halaman event, pilih booth di denah, lalu bayar.",
            href: "/dashboard/tenant/events",
            cta: "Cari event",
            done: bookings.length > 0,
          },
          {
            key: "catalog",
            title: "Isi menu atau katalog produk",
            text: "Menu diatur per event. Pengunjung bisa langsung memesan dari panduan digital.",
            href: "/dashboard/tenant/catalog",
            cta: "Buka katalog",
          },
          {
            key: "website",
            title: "Buat mini website booth",
            text: "Halaman kecil berisi logo, tagline, dan kontak yang dibuka pengunjung dari QR.",
            href: "/dashboard/tenant/mini-website",
            cta: "Buka mini website",
            done: Boolean(user?.branding?.headline),
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="calendar" size={24} /></span>
            <span className="text-[11px] text-secondary-light font-medium">Aktif sekarang</span>
          </div>
          <div className="text-2xl font-bold mb-1">{uniqueEventsCount}</div>
          <div className="text-xs text-muted-foreground">Event Terdaftar</div>
>>>>>>> Stashed changes
        </div>

<<<<<<< Updated upstream
      {/* ========== TAB 2: BOOTH SAYA & RIWAYAT SEWA ========== */}
      {activeTab === "booths" && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="card-base p-8 text-center border-dashed border-white/10">
              <span className="text-4xl block mb-2">🏪</span>
              <h3 className="font-bold text-sm mb-1 text-foreground">Belum Ada Booth yang Disewa</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                Akun brand ini belum memiliki sewa booth aktif di event mana pun. Cari event dan daftarkan booth impianmu sekarang!
              </p>
              <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                Jelajahi Event Pameran →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking, i) => (
                <div key={i} className="card-base p-6 border border-white/5 hover:border-primary/30 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center font-bold text-white text-base">
                        {booking.booth}
                      </div>
                      <span className={`badge text-[10px] ${booking.payment === "paid" ? "badge-primary" : "badge-accent"}`}>
                        {booking.payment === "paid" ? "✓ Lunas" : "⏳ Pending"}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-1">{booking.event}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      📅 {booking.date} • Booth {booking.booth}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Status sewa aktif. Booth ini telah terpetakan di Denah Pengunjung digital event.
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/events/${booking.eventId || "1"}/guide`}
                        className="btn btn-secondary btn-sm text-xs flex items-center justify-center gap-1"
=======
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="store" size={24} /></span>
            <span className="text-[11px] text-secondary-light font-medium">Di {uniqueEventsCount} event</span>
          </div>
          <div className="text-2xl font-bold mb-1">{bookings.length}</div>
          <div className="text-xs text-muted-foreground">Booth Aktif</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="card" size={24} /></span>
            <span className="text-[11px] text-secondary-light font-medium">Semua booking</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {totalSpent.toLocaleString("id-ID")}
          </div>
          <div className="text-xs text-muted-foreground">Total Investasi Booth</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="package" size={24} /></span>
            <span className="text-[11px] text-secondary-light font-medium">Langsung dari pengunjung</span>
          </div>
          <div className="text-2xl font-bold mb-1">{paidOrders.length}</div>
          <div className="text-xs text-muted-foreground">Pesanan masuk · Rp {salesRevenue.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Bookings & Incoming Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Bookings */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Booth Saya</h2>
              <Link href="/dashboard/tenant/catalog" className="btn btn-secondary btn-sm">
                Kelola menu
              </Link>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-foreground/10 rounded-xl p-6">
                <span className="text-3xl block mb-2"><Icon name="store" size={32} /></span>
                <p className="font-semibold text-foreground mb-1">Belum Ada Booth yang Disewa</p>
                <p className="text-xs mb-4">Akun brand ini belum memiliki sewa booth aktif. Jelajahi event yang cocok untuk brand kamu.</p>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari &amp; Sewa Booth Sekarang
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition border border-foreground/[0.03]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center font-bold text-sm">
                        {booking.booth}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{booking.event}</h3>
                        <p className="text-xs text-muted-foreground">{booking.date} • Booth {booking.booth}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentBadge status={booking.payment} />
                      <Link
                        href={`/events/${booking.eventId}/guide`}
                        className="btn btn-ghost btn-sm text-xs text-primary-light"
                        title="Lihat tampilan booth di Denah Pengunjung"
>>>>>>> Stashed changes
                      >
                        🗺️ Buka Denah
                      </Link>
<<<<<<< Updated upstream
                      <Link
                        href="/dashboard/tenant/catalog"
                        className="btn btn-secondary btn-sm text-xs flex items-center justify-center gap-1"
                      >
                        📦 Atur Menu
                      </Link>
                    </div>
                    <button
                      onClick={() => setSelectedPass(booking)}
                      className="btn btn-primary btn-sm w-full text-xs flex items-center justify-center gap-1"
                      id={`open-pass-${booking.booth}`}
                    >
                      🎫 Lihat E-Pass Booth
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== MODAL E-PASS BOOTH ========== */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedPass(null)}>
          <div className="card-base max-w-sm w-full p-6 text-center border-primary/30 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg"
            >
              ✕
            </button>

            <span className="badge badge-primary text-[10px] mb-2">OFFICIAL TENANT PASS</span>
            <h3 className="font-bold text-lg text-foreground mb-1">{selectedPass.event}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedPass.date}</p>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 my-4 inline-block w-full">
              <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center text-3xl font-black text-white shadow-xl mb-3">
                {selectedPass.booth}
              </div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Booth Number: {selectedPass.booth}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                ✓ Terverifikasi &amp; Lunas
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              Tunjukkan E-Pass ini kepada panitia saat Check-in &amp; Loading In perlengkapan booth di lokasi acara.
            </p>

            <button
              onClick={() => setSelectedPass(null)}
              className="btn btn-primary btn-sm w-full"
            >
              Tutup E-Pass
            </button>
=======
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
                <h2 className="font-semibold text-foreground">Pesanan masuk dari pengunjung</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary text-[10px]">{paidOrders.length} Pesanan</span>
                <Link href="/dashboard/tenant/bookings" className="btn btn-ghost btn-sm text-[11px] text-primary-light">
                  Lihat semua pesanan
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pesanan yang dibuat oleh pengunjung melalui QR Code / panduan pengunjung. Pesanan masuk setelah pembayarannya dikonfirmasi.
              {awaitingPaymentCount > 0 && ` ${awaitingPaymentCount} pesanan masih menunggu pembayaran.`}
            </p>

            {paidOrders.length === 0 ? (
              <div className="p-6 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/10 text-center">
                <span className="text-3xl block mb-2"><Icon name="clipboard" size={32} /></span>
                <p className="font-semibold text-xs text-foreground mb-1">Belum Ada Pesanan Masuk</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Saat pengunjung memindai QR Code di booth kamu atau memesan produk via Panduan Digital, pesanan baru akan langsung masuk ke sini secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paidOrders.slice(0, 5).map((order) => {
                  const status = order.status || "pending";
                  const boothLabel = order.booth || order.items[0]?.boothId || "-";
                  return (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${status === "making"
                          ? "bg-sky-500/[0.04] border-sky-500/30"
                          : status === "ready"
                            ? "bg-emerald-500/[0.04] border-emerald-500/40"
                            : status === "done"
                              ? "bg-foreground/[0.01] border-foreground/5 opacity-70"
                              : "bg-amber-500/[0.03] border-amber-500/30"
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-mono text-primary-light">{order.id}</span>
                          <span className="badge badge-secondary text-[10px] font-semibold">
                            {order.event ? `${order.event} · ` : ""}Booth {boothLabel}
                          </span>
                          <PaymentBadge status={order.paymentStatus} />
                          <span className="badge badge-secondary text-[9px]">{order.method}</span>
                          <span className="text-[10px] text-muted-foreground">{order.time}</span>
                          {status === "pending" && (
                            <span className="badge text-[9px] bg-amber-500/15 text-amber-700">Baru Masuk</span>
                          )}
                          {status === "making" && (
                            <span className="badge text-[9px] bg-sky-500/15 text-sky-700 animate-pulse">Sedang Dibuat</span>
                          )}
                          {status === "ready" && (
                            <span className="badge text-[9px] bg-emerald-500/15 text-emerald-700">Siap Diambil</span>
                          )}
                          {status === "done" && (
                            <span className="badge text-[9px] bg-foreground/10 text-muted-foreground">Selesai</span>
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
                          Rp {(order.total || 0).toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {status === "pending" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "making")}
                              className="btn btn-primary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-make-${order.id}`}
                            >
                              Buat
                            </button>
                          )}
                          {status === "making" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "ready")}
                              className="btn btn-primary btn-sm"
                              id={`dash-ready-${order.id}`}
                            >
                              Siap
                            </button>
                          )}
                          {status === "ready" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "done")}
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-done-${order.id}`}
                            >
                              Selesai
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

          {/* What is on sale vs what was ordered, every event */}
          <div className="card-base p-6" id="tenant-sales-summary">
            <h2 className="font-semibold mb-1">Produk &amp; penjualan (semua event)</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Menu tiap event dicocokkan dengan pesanan yang sudah dibayar. Produk yang belum pernah dipesan tetap tampil dengan angka 0.
            </p>
            {salesRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada menu atau pesanan. Isi menu lewat{" "}
                <Link href="/dashboard/tenant/catalog" className="text-primary-light font-semibold underline">Katalog Produk</Link>.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="ledger-table text-xs">
                  <thead>
                    <tr>
                      <th scope="col">Produk</th>
                      <th scope="col">Event</th>
                      <th scope="col" className="text-right">Harga</th>
                      <th scope="col" className="text-right">Stok</th>
                      <th scope="col" className="text-right">Terjual</th>
                      <th scope="col">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRows.map((row) => (
                      <tr key={row.key} className="ledger-row">
                        <td className="font-medium text-foreground">
                          {row.product}
                          {!row.inMenu && <span className="block text-[10px] text-amber-700 font-normal">Sudah tidak ada di menu</span>}
                        </td>
                        <td className="text-muted-foreground">{row.event}</td>
                        <td className="text-right fig">Rp {row.price.toLocaleString("id-ID")}</td>
                        <td className="text-right fig">{row.stock === null ? "-" : row.stock}</td>
                        <td className="text-right fig font-semibold">{row.sold}</td>
                        <td className="fig">Rp {row.revenue.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-3 font-semibold">Total</td>
                      <td className="pt-3 text-right fig font-semibold">{salesRows.reduce((s, r) => s + r.sold, 0)}</td>
                      <td className="pt-3 fig font-semibold">Rp {salesRows.reduce((s, r) => s + r.revenue, 0).toLocaleString("id-ID")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
>>>>>>> Stashed changes
          </div>
        </div>

        {/* Right Column: Recommended Events */}
        <div>
          <div className="card-base p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              Rekomendasi Event
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Event yang cocok dengan profil produk kamu</p>
            <div className="space-y-3">
              {recommendedEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block p-4 rounded-xl bg-foreground/[0.03] hover:bg-white/[0.04] transition">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <span className="text-xs font-bold text-primary-light">{event.match}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{event.date} • {event.location}</p>
                  <div className="mt-2"><CategoryPopover categories={event.categories} category={event.category} label="Kategori" /></div>
                </Link>
              ))}
            </div>
            {recommendedEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada event lain yang sedang membuka booth.</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-3">
              Dihitung dari kecocokan kategori, tema, dan ketersediaan booth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}