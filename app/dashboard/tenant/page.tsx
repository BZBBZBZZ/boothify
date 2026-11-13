"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

import {
  listTenantBookings,
  listTenantOrders,
  listPublishedEvents,
  updateOrderStatus as saveOrderStatus,
  errorMessage,
  type Booking,
  type VisitorOrder,
  type OrderStatus,
} from "@/app/lib/db";
import { calculateEventTenantMatch, tenantProfileFromUser } from "@/app/lib/tenant-match";
import { isUpcomingEvent } from "@/app/lib/tenant-events";
import Icon from "../../components/Icon";
import CategoryPopover from "../../components/CategoryPopover";

type OrderView = VisitorOrder & { time: string };

const orderTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visitorOrders, setVisitorOrders] = useState<OrderView[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Array<{ id: string; title: string; date: string; location: string; match: string; categories?: string[]; category?: string }>>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const tenantId = user?.id || "";
    if (!tenantId || user?.role !== "tenant") return;
    let cancelled = false;

    const loadOrders = () =>
      listTenantOrders(tenantId)
        .then((orders) => {
          if (!cancelled) setVisitorOrders(orders.map((o) => ({ ...o, time: orderTime(o.createdAt) })));
        })
        .catch(() => {});

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
          .catch(() => {});
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
  const totalSpent = bookings.reduce((sum, b) => sum + b.total, 0);

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
      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-sm text-error" role="alert">{loadError}</div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Tenant</h1>
        <p className="text-muted-foreground text-sm">Kelola booth, produk, dan pantau pesanan kamu secara real-time.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="calendar" size={24} /></span>
            <span className="text-[11px] text-secondary-light font-medium">Aktif sekarang</span>
          </div>
          <div className="text-2xl font-bold mb-1">{uniqueEventsCount}</div>
          <div className="text-xs text-muted-foreground">Event Terdaftar</div>
        </div>

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
                      <span className={`badge text-[10px] ${booking.payment === "paid" ? "badge-primary" : "badge-accent"}`}>
                        {booking.payment === "paid" ? "Lunas" : "Pending"}
                      </span>
                      <Link
                        href={`/events/${booking.eventId}/guide`}
                        className="btn btn-ghost btn-sm text-xs text-primary-light"
                        title="Lihat tampilan booth di Denah Pengunjung"
                      >
                        Buka Denah
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
                  Buka KDS Penuh
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pesanan yang dibuat oleh pengunjung melalui scan QR Code / Digital Guide di booth kamu. Ubah status pesanan secara real-time.
            </p>

            {visitorOrders.length === 0 ? (
              <div className="p-6 rounded-xl bg-foreground/[0.02] border border-dashed border-foreground/10 text-center">
                <span className="text-3xl block mb-2"><Icon name="clipboard" size={32} /></span>
                <p className="font-semibold text-xs text-foreground mb-1">Belum Ada Pesanan Masuk</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Saat pengunjung memindai QR Code di booth kamu atau memesan produk via Panduan Digital, pesanan baru akan langsung masuk ke sini secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitorOrders.slice(0, 5).map((order) => {
                  const status = order.status || "pending";
                  const boothLabel = order.booth || order.items[0]?.boothId || "-";
                  return (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                        status === "making"
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
                            Booth {boothLabel}
                          </span>
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
                              className="btn btn-sm text-[11px] py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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
                <Link key={event.id} href={`/events/${event.id}`} className="block p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
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

