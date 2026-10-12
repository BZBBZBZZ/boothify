import Link from "next/link";

const STATS = [
  { label: "Event Aktif", value: "3", icon: "📅", change: "+1 bulan ini" },
  { label: "Total Booth Terisi", value: "127", icon: "🏪", change: "+18 minggu ini" },
  { label: "Pendapatan", value: "Rp 317.5 Jt", icon: "💰", change: "+12% dari bulan lalu" },
  { label: "Tenant Terdaftar", value: "89", icon: "👥", change: "+7 minggu ini" },
];

const RECENT_EVENTS = [
  { id: "1", title: "Green Fashion Expo 2026", date: "15–17 Nov 2026", status: "active", boothsFilled: 42, boothsTotal: 60 },
  { id: "2", title: "Sustainable Living Fair", date: "5–7 Des 2026", status: "draft", boothsFilled: 0, boothsTotal: 40 },
  { id: "3", title: "Eco Market Bandung", date: "20–22 Des 2026", status: "active", boothsFilled: 28, boothsTotal: 35 },
];

const RECENT_BOOKINGS = [
  { tenant: "EcoWear Studio", event: "Green Fashion Expo", booth: "A1", amount: "Rp 2.500.000", time: "2 jam lalu", status: "paid" },
  { tenant: "Green Threads", event: "Green Fashion Expo", booth: "A2", amount: "Rp 2.500.000", time: "5 jam lalu", status: "paid" },
  { tenant: "Kopi Keliling", event: "Green Fashion Expo", booth: "C3", amount: "Rp 3.000.000", time: "1 hari lalu", status: "pending" },
  { tenant: "CraftHouse", event: "Eco Market Bandung", booth: "B4", amount: "Rp 1.800.000", time: "2 hari lalu", status: "paid" },
];

export default function OrganizerDashboard() {
  return (
    <div className="animate-fade-in" id="organizer-overview">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Organizer</h1>
        <p className="text-muted-foreground text-sm">Selamat datang kembali! Berikut ringkasan event kamu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-[11px] text-primary-light font-medium">{stat.change}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              {RECENT_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
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
                  <Link href={`/dashboard/organizer/events/${event.id}/floor-plan`} className="btn btn-ghost btn-sm text-xs">
                    Kelola →
                  </Link>
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
              {RECENT_BOOKINGS.map((booking, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {booking.booth}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{booking.tenant}</p>
                    <p className="text-[11px] text-muted-foreground">{booking.time}</p>
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
    </div>
  );
}
