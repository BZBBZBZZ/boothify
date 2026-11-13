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
import Icon from "../../components/Icon";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const email = user?.email || "";
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    async function load() {
      // 1. Events: Supabase holds published events, localStorage also holds drafts
      const supabaseEvents = await getEventsFromSupabase();
      let combinedEvents: EventItem[] = (supabaseEvents || []).map((e) => ({
        id: String(e.id),
        title: e.title,
        date: e.date,
        status: "active",
        boothsFilled: e.boothsFilled,
        boothsTotal: e.boothsTotal,
        organizerEmail: e.organizerEmail || "",
      }));

      try {
        const localEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
        if (Array.isArray(localEvents)) {
          const existingIds = new Set(combinedEvents.map((e) => e.id));
          const missing = localEvents.filter((le: { id: string }) => !existingIds.has(String(le.id)));
          // Published events missing from Supabase are synced; drafts stay private until published
          missing
            .filter((item: { status?: string }) => item.status !== "draft")
            .forEach((item) => {
              saveEventToSupabase(item).catch(() => {});
            });
          const mappedMissing: EventItem[] = missing.map((e) => ({
            id: String(e.id),
            title: e.title,
            date: e.date,
            status: e.status || "active",
            boothsFilled: e.boothsFilled || 0,
            boothsTotal: e.boothsTotal || 30,
            organizerEmail: e.organizerEmail || "",
          }));
          combinedEvents = [...mappedMissing, ...combinedEvents];
        }
      } catch { /* ignore */ }

      const ownEvents = combinedEvents.filter((e) => e.organizerEmail?.toLowerCase() === email.toLowerCase());
      const ownIds = new Set(ownEvents.map((e) => e.id));
      if (cancelled) return;
      setEvents(ownEvents);

      // 2. Bookings: only those made for this organizer's own events
      const supabaseBookings = await getTenantBookingsFromSupabase();
      let ownBookings: BookingItem[] = [];
      if (supabaseBookings && supabaseBookings.length > 0) {
        ownBookings = supabaseBookings
          .filter((b) => ownIds.has(String(b.eventId)))
          .map((b) => ({
            tenant: b.tenantName || "Tenant",
            eventId: String(b.eventId),
            event: b.event,
            booth: b.booth,
            amount: b.amount,
            time: "Baru saja",
            status: b.payment as "paid" | "unpaid",
          }));
      } else {
        try {
          const local = JSON.parse(localStorage.getItem("boothify_recent_bookings") || "[]");
          if (Array.isArray(local)) {
            ownBookings = local.filter((b: BookingItem) => ownIds.has(String(b.eventId)));
          }
        } catch { /* ignore */ }
      }
      if (!cancelled) setBookings(ownBookings);
    }

    load();

    // 3. Inbox: messages addressed to this organizer only
    getOrganizerMessagesFromSupabase(email).then((supabaseMessages) => {
      if (cancelled) return;
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
          const storedInbox = JSON.parse(localStorage.getItem("boothify_organizer_inbox") || "[]");
          if (Array.isArray(storedInbox)) {
            setInbox(storedInbox.filter((m: InboxMessage) => !m.organizerEmail || m.organizerEmail.toLowerCase() === email.toLowerCase()));
          }
        } catch { /* ignore */ }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [email]);

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
            <span className="text-2xl"><Icon name="calendar" size={24} /></span>
            <span className="text-[11px] text-primary-light font-medium">Event Aktif</span>
          </div>
          <div className="text-2xl font-bold mb-1">{events.filter((e) => e.status !== "draft").length}</div>
          <div className="text-xs text-muted-foreground">
            Event diterbitkan{events.some((e) => e.status === "draft") ? `, ${events.filter((e) => e.status === "draft").length} draft` : ""}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="store" size={24} /></span>
            <span className="text-[11px] text-primary-light font-medium">Terisi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{totalBoothsFilled}</div>
          <div className="text-xs text-muted-foreground">Total Booth Tersewa</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="wallet" size={24} /></span>
            <span className="text-[11px] text-primary-light font-medium">Estimasi</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formattedRevenue}</div>
          <div className="text-xs text-muted-foreground">Pendapatan Sewa Booth</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl"><Icon name="inbox" size={24} /></span>
            <span className={`text-[11px] font-medium ${unreadCount > 0 ? "text-amber-700 font-bold" : "text-primary-light"}`}>
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
                <span className="text-4xl block mb-2"><Icon name="store" size={32} /></span>
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
                  <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition border border-foreground/[0.03]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{event.title}</h3>
                        <span className={`badge text-[10px] ${event.status === "active" ? "badge-primary" : "bg-foreground/5 text-muted-foreground"}`}>
                          {event.status === "active" ? "Aktif" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                      {event.boothsTotal > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-foreground/5 overflow-hidden max-w-[120px]">
                            <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(100, ((event.boothsFilled || 0) / event.boothsTotal) * 100)}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground">{event.boothsFilled || 0}/{event.boothsTotal} booth</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.status === "draft" ? (
                        <>
                          <Link
                            href={`/dashboard/organizer/events/${event.id}/edit`}
                            onClick={() => setActiveOrganizerEventId(event.id)}
                            className="btn btn-ghost btn-sm text-xs"
                          >
                            Edit Info
                          </Link>
                          <Link
                            href={`/dashboard/organizer/events/${event.id}/floor-plan`}
                            onClick={() => setActiveOrganizerEventId(event.id)}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Lanjutkan Denah &amp; Terbitkan
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/events/${event.id}`}
                            onClick={() => setActiveOrganizerEventId(event.id)}
                            className="btn btn-ghost btn-sm text-xs"
                          >
                            Lihat Halaman
                          </Link>
                          <Link
                            href={`/dashboard/organizer/events/${event.id}/qr-code`}
                            onClick={() => setActiveOrganizerEventId(event.id)}
                            className="btn btn-secondary btn-sm text-xs"
                          >
                            QR
                          </Link>
                          <Link
                            href={`/dashboard/organizer/events/${event.id}/floor-plan`}
                            onClick={() => setActiveOrganizerEventId(event.id)}
                            className="btn btn-primary btn-sm text-xs"
                          >
                            Denah Booth
                          </Link>
                        </>
                      )}
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
                <span className="text-3xl block mb-2"><Icon name="store" size={32} /></span>
                <p className="font-medium text-xs mb-1">Belum Ada Pendaftaran</p>
                <p className="text-[11px] text-muted-foreground">
                  Pendaftaran sewa booth dari tenant akan langsung tampil di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.03]">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-secondary text-xs font-bold">
                      {booking.booth}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{booking.tenant}</p>
                      <p className="text-[11px] text-muted-foreground">{booking.time} • {booking.event}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{booking.amount}</p>
                      <span className={`text-[10px] ${booking.status === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                        {booking.status === "paid" ? "Terbayar" : "Pending"}
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
