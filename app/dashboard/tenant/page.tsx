"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const STATS = [
  { label: "Event Terdaftar", value: "2", icon: "📅", change: "Aktif sekarang" },
  { label: "Booth Aktif", value: "3", icon: "🏪", change: "Di 2 event" },
  { label: "Total Pengeluaran", value: "Rp 7.5 Jt", icon: "💳", change: "Bulan ini" },
  { label: "Pesanan Masuk", value: "124", icon: "📦", change: "+32 hari ini" },
];

const DEFAULT_BOOKINGS = [
  { event: "Green Fashion Expo 2026", booth: "A1", date: "15–17 Nov 2026", status: "confirmed", payment: "paid" },
  { event: "Green Fashion Expo 2026", booth: "A2", date: "15–17 Nov 2026", status: "confirmed", payment: "paid" },
  { event: "Eco Market Bandung", booth: "C2", date: "20–22 Des 2026", status: "confirmed", payment: "pending" },
];

const RECOMMENDED_EVENTS = [
  { id: "3", title: "EduTech Innovation Fair", date: "1–3 Des 2026", location: "Surabaya", match: "92%", reason: "Cocok dengan kategori Education" },
  { id: "6", title: "Sustainable Living Expo", date: "5–7 Jan 2027", location: "Bali", match: "87%", reason: "Relevan dengan produk ramah lingkungan" },
];

export default function TenantDashboard() {
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_tenant_bookings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge unique bookings
          setBookings(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="animate-fade-in" id="tenant-overview">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Tenant</h1>
        <p className="text-muted-foreground text-sm">Kelola booth, produk, dan pantau pesanan kamu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, i) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-[11px] text-secondary-light font-medium">{stat.change}</span>
            </div>
            <div className="text-2xl font-bold mb-1">
              {i === 1 ? bookings.length : stat.value}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Bookings */}
        <div className="lg:col-span-2">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Booth Saya</h2>
              <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">Cari Event Baru</Link>
            </div>
            <div className="space-y-3">
              {bookings.map((booking, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-sm">
                    {booking.booth}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{booking.event}</h3>
                    <p className="text-xs text-muted-foreground">{booking.date} • Booth {booking.booth}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-[10px] ${booking.payment === "paid" ? "badge-primary" : "badge-accent"}`}>
                      {booking.payment === "paid" ? "✓ Lunas" : "⏳ Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommended Events */}
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
