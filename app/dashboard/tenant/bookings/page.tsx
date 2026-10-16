"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  getTenantBookingsFromSupabase,
  getVisitorOrdersFromSupabase,
} from "@/app/lib/supabase-service";

export default function TenantBookingsAndOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "booths">("orders");
  const [orders, setOrders] = useState<VisitorOrder[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedPass, setSelectedPass] = useState<BookingItem | null>(null);

  // Load from localStorage scoped to user
  useEffect(() => {
    const email = user?.email || "demo-tenant@boothify.id";

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
        </div>
      )}

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
                      >
                        🗺️ Buka Denah
                      </Link>
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
          </div>
        </div>
      )}
    </div>
  );
}
