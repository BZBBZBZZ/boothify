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

const DEFAULT_EVENTS: EventItem[] = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", status: "active", boothsFilled: 5, boothsTotal: 9, organizerEmail: "demo-organizer@boothify.id" },
  { id: "2", title: "Indonesia Food Festival 2026", date: "22–24 Nov 2026", status: "active", boothsFilled: 3, boothsTotal: 10, organizerEmail: "demo-organizer@boothify.id" },
  { id: "3", title: "EduTech Innovation Fair 2026", date: "1–3 Des 2026", status: "active", boothsFilled: 2, boothsTotal: 8, organizerEmail: "demo-organizer@boothify.id" },
];

const DEFAULT_BOOKINGS: BookingItem[] = [
  { tenant: "EcoWear Studio", event: "Green Fashion Expo 2026", booth: "A1", amount: "Rp 2.500.000", time: "2 jam lalu", status: "paid" },
  { tenant: "EcoWear Studio — Koleksi Katun", event: "Green Fashion Expo 2026", booth: "A2", amount: "Rp 2.500.000", time: "5 jam lalu", status: "paid" },
  { tenant: "Kopi Keliling Nusantara", event: "Green Fashion Expo 2026", booth: "B1", amount: "Rp 3.000.000", time: "8 jam lalu", status: "paid" },
  { tenant: "Kopi Keliling Nusantara", event: "Green Fashion Expo 2026", booth: "C1", amount: "Rp 3.000.000", time: "1 hari lalu", status: "paid" },
  { tenant: "EcoWear Craft & Totebag", event: "Green Fashion Expo 2026", booth: "C3", amount: "Rp 1.800.000", time: "2 hari lalu", status: "paid" },
];

const DEFAULT_MESSAGES: InboxMessage[] = [
  {
    id: "MSG-101",
    eventId: "1",
    eventTitle: "Green Fashion Expo 2026",
    senderName: "EcoWear Studio",
    senderEmail: "demo-tenant@boothify.id",
    senderPhone: "+62 813 9876 5432",
    message: "Halo Organizer, apakah booth A1 menyediakan daya listrik tambahan untuk display koleksi EcoWear Studio?",
    time: "45 menit lalu",
    status: "unread",
  },
  {
    id: "MSG-102",
    eventId: "1",
    eventTitle: "Green Fashion Expo 2026",
    senderName: "Kopi Keliling Nusantara",
    senderEmail: "kopi@boothify.id",
    senderPhone: "+62 878 1122 3344",
    message: "Selamat siang, apakah booth C1 memiliki akses listrik untuk espresso machine portabel kami?",
    time: "3 jam lalu",
    status: "read",
  },
];

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const email = user?.email || "demo-organizer@boothify.id";
  const isDemoOrg = email === "demo-organizer@boothify.id" || email === "organizer@boothify.id";

  const [events, setEvents] = useState<EventItem[]>(isDemoOrg ? DEFAULT_EVENTS : []);
  const [bookings, setBookings] = useState<BookingItem[]>(isDemoOrg ? DEFAULT_BOOKINGS : []);
  const [inbox, setInbox] = useState<InboxMessage[]>(isDemoOrg ? DEFAULT_MESSAGES : []);
  const [filterInbox, setFilterInbox] = useState<"all" | "unread">("all");

  useEffect(() => {
    try {
      // 1. Load Events
      const storedEventsRaw = localStorage.getItem("boothify_events");
      const storedEvents: EventItem[] = storedEventsRaw ? JSON.parse(storedEventsRaw) : [];

      if (isDemoOrg) {
        // For demo organizer: show default events merged with events created by demo organizer
        const myStored = storedEvents.filter(
          (e) => !e.organizerEmail || e.organizerEmail === "demo-organizer@boothify.id" || e.organizerEmail === "organizer@boothify.id"
        );
        const combined = [...myStored];
        DEFAULT_EVENTS.forEach((defEv) => {
          if (!combined.some((e) => e.id === defEv.id)) {
            combined.push(defEv);
          }
        });
        setEvents(combined);
      } else {
        // For newly registered organizer: strictly only show events created by this organizer
        const myEvents = storedEvents.filter((e) => e.organizerEmail?.toLowerCase() === email.toLowerCase());
        setEvents(myEvents);
      }

      // 2. Load Bookings
      const storedBookingsRaw = localStorage.getItem("boothify_recent_bookings");
      const storedBookings: BookingItem[] = storedBookingsRaw ? JSON.parse(storedBookingsRaw) : [];

      if (isDemoOrg) {
        const combinedBookings = [...storedBookings];
        DEFAULT_BOOKINGS.forEach((defB) => {
          if (!combinedBookings.some((b) => b.booth === defB.booth && b.event === defB.event)) {
            combinedBookings.push(defB);
          }
        });
        setBookings(combinedBookings);
      } else {
        // For new organizer: show bookings that match their event titles or organizerEmail
        const myEventTitles = storedEvents.filter((e) => e.organizerEmail === email).map((e) => e.title);
        const myBookings = storedBookings.filter((b) => myEventTitles.includes(b.event));
        setBookings(myBookings);
      }

      // 3. Load Inbox Messages
      const storedInboxRaw = localStorage.getItem("boothify_organizer_inbox");
      const storedInbox: InboxMessage[] = storedInboxRaw ? JSON.parse(storedInboxRaw) : [];

      if (isDemoOrg) {
        if (storedInbox.length > 0) {
          setInbox(storedInbox);
        } else {
          setInbox(DEFAULT_MESSAGES);
          localStorage.setItem("boothify_organizer_inbox", JSON.stringify(DEFAULT_MESSAGES));
        }
      } else {
        const myEventIds = storedEvents.filter((e) => e.organizerEmail === email).map((e) => e.id);
        const myInbox = storedInbox.filter(
          (m) => (m.eventId && myEventIds.includes(m.eventId)) || m.organizerEmail === email
        );
        setInbox(myInbox);
      }
    } catch {
      // ignore
    }
  }, [user, email, isDemoOrg]);

  const unreadCount = inbox.filter((m) => m.status === "unread").length;

  const markAsRead = (id: string) => {
    const updated = inbox.map((m) => (m.id === id ? { ...m, status: "read" as const } : m));
    setInbox(updated);
    try {
      localStorage.setItem("boothify_organizer_inbox", JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const deleteMessage = (id: string) => {
    const updated = inbox.filter((m) => m.id !== id);
    setInbox(updated);
    try {
      localStorage.setItem("boothify_organizer_inbox", JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const filteredMessages = filterInbox === "unread" ? inbox.filter((m) => m.status === "unread") : inbox;

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

      {/* ========== ORGANIZER INBOX SECTION ========== */}
      <div className="card-base p-6" id="organizer-inbox">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📬</span>
              <h2 className="font-semibold text-lg">Pesan Masuk dari Tenant &amp; Pengunjung</h2>
              {unreadCount > 0 && (
                <span className="badge badge-accent text-[10px]">{unreadCount} Baru</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pesan dan pertanyaan yang dikirim melalui formulir &quot;Hubungi Organizer&quot; di detail acara.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterInbox("all")}
              className={`btn btn-sm ${filterInbox === "all" ? "btn-primary" : "btn-secondary"}`}
            >
              Semua ({inbox.length})
            </button>
            <button
              onClick={() => setFilterInbox("unread")}
              className={`btn btn-sm ${filterInbox === "unread" ? "btn-primary" : "btn-secondary"}`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-medium text-sm">Tidak Ada Pesan</p>
            <p className="text-xs text-muted-foreground">
              {filterInbox === "unread"
                ? "Semua pesan telah dibaca."
                : "Belum ada pesan yang masuk dari calon tenant atau pengunjung acara."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border transition-all ${
                  msg.status === "unread"
                    ? "bg-primary/[0.04] border-primary/30"
                    : "bg-white/[0.01] border-white/5 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">({msg.senderEmail})</span>
                    {msg.status === "unread" && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Belum dibaca" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="badge badge-secondary text-[10px]">{msg.eventTitle}</span>
                    <span>{msg.time}</span>
                  </div>
                </div>

                <p className="text-sm text-foreground/90 mb-3 bg-card/60 p-3 rounded-lg border border-border/50">
                  {msg.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-muted-foreground">
                    <span>📱 WA/Telp: </span>
                    <span className="font-mono text-foreground">{msg.senderPhone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.senderPhone && (
                      <a
                        href={`https://wa.me/${msg.senderPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm text-xs text-emerald-400"
                      >
                        💬 Balas WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${msg.senderEmail}?subject=Re: Pertanyaan Event ${encodeURIComponent(msg.eventTitle)}`}
                      className="btn btn-secondary btn-sm text-xs"
                    >
                      ✉️ Balas Email
                    </a>
                    {msg.status === "unread" && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="btn btn-ghost btn-sm text-xs text-primary-light"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="btn btn-ghost btn-sm text-xs text-error"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
