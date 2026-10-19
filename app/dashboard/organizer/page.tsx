"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { setActiveOrganizerEventId } from "@/app/lib/event-defaults";

type EventItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  boothsFilled: number;
  boothsTotal: number;
  organizerEmail?: string;
};

type BookingItem = {
  tenant: string;
  tenantEmail?: string;
  eventId?: string;
  event: string;
  booth: string;
  amount: string;
  time: string;
  status: string;
};

type InboxMessage = {
  id: string;
  eventId?: string;
  eventTitle: string;
  organizerEmail?: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  time: string;
  date?: string;
  status: "unread" | "read" | "replied";
};

import {
  getEventsFromSupabase,
  getTenantBookingsFromSupabase,
  getOrganizerMessagesFromSupabase,
  saveEventToSupabase,
} from "@/app/lib/supabase-service";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const email = user?.email || "demo-organizer@boothify.id";
  const isDemoOrg = email === "demo-organizer@boothify.id" || email === "organizer@boothify.id";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);

  useEffect(() => {
    // 1. Load Events from Supabase & Merge Local Storage
    getEventsFromSupabase().then((supabaseEvents) => {
      let combinedEvents: EventItem[] = (supabaseEvents || []).map((e) => ({
        id: String(e.id),
        title: e.title,
        date: e.date,
        status: "active",
        boothsFilled: e.boothsFilled,
        boothsTotal: e.boothsTotal,
        organizerEmail: e.organizerEmail || "demo-organizer@boothify.id",
      }));

      // Cek apakah ada event di localStorage yang belum masuk ke Supabase
      try {
        const storedEventsRaw = localStorage.getItem("boothify_events");
        if (storedEventsRaw) {
          const localEvents = JSON.parse(storedEventsRaw);
          if (Array.isArray(localEvents)) {
            const existingIds = new Set(combinedEvents.map((e) => e.id));
            const missing = localEvents.filter((le: { id: string }) => !existingIds.has(String(le.id)));
            if (missing.length > 0) {
              // Auto-sync missing events ke Supabase di background
              missing.forEach((item) => {
                saveEventToSupabase(item).catch(() => {});
              });
              const mappedMissing: EventItem[] = missing.map((e) => ({
                id: String(e.id),
                title: e.title,
                date: e.date,
                status: e.status || "active",
                boothsFilled: e.boothsFilled || 0,
                boothsTotal: e.boothsTotal || 30,
                organizerEmail: e.organizerEmail || "demo-organizer@boothify.id",
              }));
              combinedEvents = [...mappedMissing, ...combinedEvents];
            }
          }
        }
      } catch { /* ignore */ }

      setEvents(isDemoOrg ? combinedEvents : combinedEvents.filter((e) => e.organizerEmail?.toLowerCase() === email.toLowerCase()));
    });

    // 2. Load Bookings from Supabase
    getTenantBookingsFromSupabase().then((supabaseBookings) => {
      if (supabaseBookings && supabaseBookings.length > 0) {
        const mapped: BookingItem[] = supabaseBookings.map((b) => ({
          tenant: b.tenantName || "Tenant",
          event: b.event,
          booth: b.booth,
          amount: b.amount,
          time: "Baru saja",
          status: b.payment as "paid" | "unpaid",
        }));
        setBookings(mapped);
      } else {
        try {
          const storedBookingsRaw = localStorage.getItem("boothify_recent_bookings");
          if (storedBookingsRaw) setBookings(JSON.parse(storedBookingsRaw));
        } catch { /* ignore */ }
      }
    });

    // 3. Load Inbox Messages from Supabase
    getOrganizerMessagesFromSupabase(isDemoOrg ? undefined : email).then((supabaseMessages) => {
      if (supabaseMessages && supabaseMessages.length > 0) {
        const mapped: InboxMessage[] = supabaseMessages.map((m) => ({
          id: m.id,
          eventId: m.eventId,
          eventTitle: m.eventTitle,
          senderName: m.senderName,
          senderEmail: m.senderEmail,
          senderPhone: m.senderPhone,
          message: m.message,
          time: "Baru saja",
          status: m.status as "unread" | "read" | "replied",
        }));
        setInbox(mapped);
      } else {
        try {
          const storedInboxRaw = localStorage.getItem("boothify_organizer_inbox");
          if (storedInboxRaw) setInbox(JSON.parse(storedInboxRaw));
        } catch { /* ignore */ }
      }
    });
  }, [user, email, isDemoOrg]);

  const unreadCount = inbox.filter((m) => m.status === "unread").length;

  // Dynamic metrics calculation
  const totalBoothsFilled = events.reduce((sum, e) => sum + (e.boothsFilled || 0), 0);
  const totalRevenueNumber = bookings.reduce((sum, b) => {
    const cleanNum = Number(b.amount.replace(/[^0-9]/g, ""));
    return sum + (isNaN(cleanNum) ? 0 : cleanNum);
  }, 0);
  const formattedRevenue = `Rp ${(totalRevenueNumber / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;

  return (
    <div className="animate-fade-in" id="organizer-overview">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Organizer</h1>
          <p className="text-muted-foreground text-sm">
            Selamat datang, <span className="text-foreground font-semibold">{user?.businessName || user?.name || "Organizer"}</span>! Pantau event, pendaftaran booth, dan pesan masuk.
          </p>
        </div>
        <Link href="/dashboard/organizer/events/new" className="btn btn-primary" id="btn-create-event-header">
          + Buat Event Baru
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📅</span>
            <span className="text-[11px] text-primary-light font-medium">Event Aktif</span>
          </div>
          <div className="text-2xl font-bold mb-1">{events.length}</div>
          <div className="text-xs text-muted-foreground">Total Agenda Event</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] text-primary-light font-medium">Terisi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{totalBoothsFilled}</div>
          <div className="text-xs text-muted-foreground">Total Booth Tersewa</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💰</span>
            <span className="text-[11px] text-primary-light font-medium">Estimasi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formattedRevenue}</div>
          <div className="text-xs text-muted-foreground">Pendapatan Sewa Booth</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📬</span>
            <span className={`text-[11px] font-medium ${unreadCount > 0 ? "text-amber-400 font-bold" : "text-primary-light"}`}>
              {unreadCount > 0 ? `${unreadCount} Belum Dibaca` : "Semua Terbaca"}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">{inbox.length}</div>
          <div className="text-xs text-muted-foreground">Pesan Masuk (Inbox)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Kelola Event</h2>
              <Link href="/dashboard/organizer/events/new" className="btn btn-primary btn-sm">
                + Buat Event
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <span className="text-4xl block mb-2">🎪</span>
                <p className="font-semibold text-sm mb-1">Belum Ada Event Dibuat</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                  Mulai buat expo, bazar, atau festival Anda dan sediakan denah booth interaktif untuk tenant.
                </p>
                <Link href="/dashboard/organizer/events/new" className="btn btn-primary btn-sm">
                  + Buat Event Pertama Anda
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition border border-white/[0.03]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{event.title}</h3>
                        <span className={`badge text-[10px] ${event.status === "active" ? "badge-primary" : "bg-white/5 text-muted-foreground"}`}>
                          {event.status === "active" ? "Aktif" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                      {event.boothsTotal > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[120px]">
                            <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(100, ((event.boothsFilled || 0) / event.boothsTotal) * 100)}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground">{event.boothsFilled || 0}/{event.boothsTotal} booth</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/events/${event.id}/guide`}
                        onClick={() => setActiveOrganizerEventId(event.id)}
                        className="btn btn-ghost btn-sm text-xs"
                      >
                        Lihat Panduan ↗
                      </Link>
                      <Link
                        href={`/dashboard/organizer/events/${event.id}/qr-code`}
                        onClick={() => setActiveOrganizerEventId(event.id)}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        QR ↗
                      </Link>
                      <Link
                        href={`/dashboard/organizer/events/${event.id}/floor-plan`}
                        onClick={() => setActiveOrganizerEventId(event.id)}
                        className="btn btn-primary btn-sm text-xs"
                      >
                        Denah Booth →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="card-base p-6">
            <h2 className="font-semibold mb-5 text-lg">Pendaftaran Booth</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                <span className="text-3xl block mb-2">🏪</span>
                <p className="font-medium text-xs mb-1">Belum Ada Pendaftaran</p>
                <p className="text-[11px] text-muted-foreground">
                  Pendaftaran sewa booth dari tenant akan langsung tampil di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      {booking.booth}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.tenant}</p>
                      <p className="text-[11px] text-muted-foreground">{booking.time} • {booking.event}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{booking.amount}</p>
                      <span className={`text-[10px] ${booking.status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                        {booking.status === "paid" ? "✓ Terbayar" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
