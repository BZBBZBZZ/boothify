"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  boothsFilled: number;
  boothsTotal: number;
};

type BookingItem = {
  tenant: string;
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
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  time: string;
  date?: string;
  status: "unread" | "read" | "replied";
};

const DEFAULT_EVENTS: EventItem[] = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", status: "active", boothsFilled: 42, boothsTotal: 60 },
  { id: "2", title: "Sustainable Living Fair", date: "5–7 Des 2026", status: "draft", boothsFilled: 0, boothsTotal: 40 },
  { id: "3", title: "Eco Market Bandung", date: "20–22 Des 2026", status: "active", boothsFilled: 28, boothsTotal: 35 },
];

const DEFAULT_BOOKINGS: BookingItem[] = [
  { tenant: "EcoWear Studio", event: "Green Fashion Expo", booth: "A1", amount: "Rp 2.500.000", time: "2 jam lalu", status: "paid" },
  { tenant: "Green Threads", event: "Green Fashion Expo", booth: "A2", amount: "Rp 2.500.000", time: "5 jam lalu", status: "paid" },
  { tenant: "Kopi Keliling", event: "Green Fashion Expo", booth: "C3", amount: "Rp 3.000.000", time: "1 hari lalu", status: "pending" },
  { tenant: "CraftHouse", event: "Eco Market Bandung", booth: "B4", amount: "Rp 1.800.000", time: "2 hari lalu", status: "paid" },
];

const DEFAULT_MESSAGES: InboxMessage[] = [
  {
    id: "MSG-101",
    eventId: "1",
    eventTitle: "Green Fashion Expo 2026",
    senderName: "Batik Nusa Craft",
    senderEmail: "batiknusa@gmail.com",
    senderPhone: "081234567890",
    message: "Halo Organizer, apakah untuk booth zona Craft tersedia daya listrik 1300 Watt untuk mesin jahit display dan lighting?",
    time: "45 menit lalu",
    status: "unread",
  },
  {
    id: "MSG-102",
    eventId: "1",
    eventTitle: "Green Fashion Expo 2026",
    senderName: "Kopi Seduh Nusantara",
    senderEmail: "kopiseduh@gmail.com",
    senderPhone: "087788991122",
    message: "Selamat siang, kami tertarik menyewa booth F&B. Apakah diperbolehkan membawa mesin espresso dual boiler?",
    time: "3 jam lalu",
    status: "read",
  },
];

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [bookings, setBookings] = useState<BookingItem[]>(DEFAULT_BOOKINGS);
  const [inbox, setInbox] = useState<InboxMessage[]>(DEFAULT_MESSAGES);
  const [filterInbox, setFilterInbox] = useState<"all" | "unread">("all");

  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem("boothify_events");
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents([...parsed, ...DEFAULT_EVENTS]);
        }
      }
      const storedBookings = localStorage.getItem("boothify_recent_bookings");
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBookings([...parsed, ...DEFAULT_BOOKINGS]);
        }
      }
      const storedInbox = localStorage.getItem("boothify_organizer_inbox");
      if (storedInbox) {
        const parsed = JSON.parse(storedInbox);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInbox(parsed);
        }
      } else {
        localStorage.setItem("boothify_organizer_inbox", JSON.stringify(DEFAULT_MESSAGES));
      }
    } catch {
      // ignore
    }
  }, []);

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

  return (
    <div className="animate-fade-in" id="organizer-overview">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Organizer</h1>
        <p className="text-muted-foreground text-sm">Selamat datang kembali! Pantau event, pendapatan, dan pesan dari tenant.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📅</span>
            <span className="text-[11px] text-primary-light font-medium">+1 bulan ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">{events.length}</div>
          <div className="text-xs text-muted-foreground">Event Aktif</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] text-primary-light font-medium">+18 minggu ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">127</div>
          <div className="text-xs text-muted-foreground">Total Booth Terisi</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💰</span>
            <span className="text-[11px] text-primary-light font-medium">+12% dari bulan lalu</span>
          </div>
          <div className="text-2xl font-bold mb-1">Rp 317.5 Jt</div>
          <div className="text-xs text-muted-foreground">Pendapatan Total</div>
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
              <h2 className="font-semibold">Event Terbaru</h2>
              <Link href="/dashboard/organizer/events/new" className="btn btn-primary btn-sm">
                + Buat Event
              </Link>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition border border-white/[0.03]">
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
                          <div className="h-full rounded-full gradient-primary" style={{ width: `${(event.boothsFilled / event.boothsTotal) * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{event.boothsFilled}/{event.boothsTotal}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/organizer/events/${event.id}/qr-code`} className="btn btn-ghost btn-sm text-xs">
                      QR ↗
                    </Link>
                    <Link href={`/dashboard/organizer/events/${event.id}/floor-plan`} className="btn btn-primary btn-sm text-xs">
                      Kelola Denah →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="card-base p-6">
            <h2 className="font-semibold mb-5">Booking Terbaru</h2>
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
                    <span className={`text-[10px] ${booking.status === "paid" ? "text-success" : "text-warning"}`}>
                      {booking.status === "paid" ? "✓ Dibayar" : "⏳ Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========== ORGANIZER INBOX SECTION (Pesan Masuk dari Hubungi Organizer) ========== */}
      <div className="card-base p-6" id="organizer-inbox">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📬</span>
              <h2 className="font-semibold text-lg">Pesan Masuk dari Tenant &amp; Calon Penyewa</h2>
              {unreadCount > 0 && (
                <span className="badge badge-accent text-[10px]">{unreadCount} Baru</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pesan dan pertanyaan yang dikirim tenant/pengunjung melalui tombol &quot;Hubungi Organizer&quot; di halaman event.
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
          <div className="text-center py-10 text-muted-foreground">
            <span className="text-3xl block mb-2">📭</span>
            <p className="text-sm">Tidak ada pesan masuk.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const cleanPhone = msg.senderPhone.replace(/[^0-9]/g, "");
              const waPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
              const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
                `Halo ${msg.senderName}, kami dari Organizer ${msg.eventTitle} menindaklanjuti pesan Anda: "${msg.message.slice(0, 60)}..."`
              )}`;
              const mailUrl = `mailto:${msg.senderEmail}?subject=${encodeURIComponent(
                `Tanggapan Pertanyaan Organizer: ${msg.eventTitle}`
              )}&body=${encodeURIComponent(
                `Halo ${msg.senderName},\n\nTerima kasih telah menghubungi kami mengenai event ${msg.eventTitle}.\n\nPertanyaan Anda: "${msg.message}"\n\nJawaban kami:\n\nSalam,\nTim Organizer`
              )}`;

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl transition border ${
                    msg.status === "unread"
                      ? "bg-primary/5 border-primary/30"
                      : "bg-white/[0.02] border-white/5"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{msg.senderName}</span>
                      <span className="badge badge-secondary text-[10px]">{msg.eventTitle}</span>
                      {msg.status === "unread" ? (
                        <span className="badge badge-accent text-[9px]">🔴 Baru</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">✓ Terbaca</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{msg.time}</span>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed mb-3 bg-white/[0.02] p-3 rounded-lg border border-white/[0.03]">
                    &quot;{msg.message}&quot;
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-white/5">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>📧 {msg.senderEmail}</span>
                      <span>📱 {msg.senderPhone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.senderPhone && msg.senderPhone !== "-" && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markAsRead(msg.id)}
                          className="btn btn-secondary btn-sm text-[11px] py-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1"
                        >
                          💬 Balas WhatsApp
                        </a>
                      )}
                      <a
                        href={mailUrl}
                        onClick={() => markAsRead(msg.id)}
                        className="btn btn-secondary btn-sm text-[11px] py-1 flex items-center gap-1"
                      >
                        ✉️ Balas Email
                      </a>
                      {msg.status === "unread" && (
                        <button
                          onClick={() => markAsRead(msg.id)}
                          className="btn btn-ghost btn-sm text-[11px] py-1 text-primary-light"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="btn btn-ghost btn-sm text-[11px] py-1 text-red-400 hover:bg-red-500/10"
                        title="Hapus pesan"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
