import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const FEATURED_EVENTS = [
  {
    id: "1",
    title: "Green Fashion Expo 2026",
    date: "15–17 Nov 2026",
    location: "Jakarta Convention Center",
    category: "Fashion",
    boothsFilled: 5,
    boothsTotal: 14,
    image: "🌿",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "2",
    title: "Indonesia Food Festival",
    date: "22–24 Nov 2026",
    location: "ICE BSD, Tangerang",
    category: "F&B",
    boothsFilled: 3,
    boothsTotal: 10,
    image: "🍜",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "3",
    title: "EduTech Innovation Fair",
    date: "1–3 Des 2026",
    location: "Surabaya Grand City",
    category: "Education",
    boothsFilled: 2,
    boothsTotal: 8,
    image: "📚",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: "4",
    title: "AutoMotive Show 2026",
    date: "10–12 Des 2026",
    location: "JIEXPO Kemayoran",
    category: "Automotive",
    boothsFilled: 4,
    boothsTotal: 12,
    image: "🚗",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
];

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
    title: "Interactive Floor Plan",
    description: "Buat denah event dengan drag & drop, atur zona booth, dan pantau ketersediaan secara real-time layaknya kursi bioskop.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    title: "QR Code Event Guide",
    description: "1 Fixed QR Code per event — pengunjung scan langsung, tanpa download aplikasi. Panduan digital lengkap di genggaman.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "AI Smart Matching",
    description: "Rekomendasi cerdas yang mencocokkan produk brand dengan event paling relevan untuk memaksimalkan exposure.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: "Pembayaran Langsung",
    description: "Integrasi QRIS, e-wallet, transfer bank, dan kartu kredit langsung di platform — checkout cepat dan aman.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Katalog Digital & Menu",
    description: "Tenant F&B unggah menu untuk self-ordering. Tenant Non-F&B tampilkan brosur, galeri, dan video — 100% paperless.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
    title: "AI Campaign Generator",
    description: "Analisis tren global & lokal secara otomatis, memberikan rekomendasi narasi campaign yang berdampak tinggi untuk event.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Buat atau Cari Event",
    description: "Organizer membuat event & denah booth. Tenant cari event yang cocok dengan produk mereka.",
    role: "Organizer & Tenant",
  },
  {
    step: "02",
    title: "Pilih & Booking Booth",
    description: "Pilih posisi booth pada denah interaktif seperti memilih kursi bioskop, lalu bayar langsung.",
    role: "Tenant",
  },
  {
    step: "03",
    title: "Atur Katalog & Media",
    description: "Upload menu makanan (F&B) atau brosur digital, galeri & video (Non-F&B) untuk pengunjung.",
    role: "Tenant",
  },
  {
    step: "04",
    title: "Hari Event — Scan & Go!",
    description: "Pengunjung scan QR Code, lihat denah interaktif, pesan makanan, atau baca info booth — semua dari HP.",
    role: "Pengunjung",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ========== HERO ========== */}
        <section className="relative min-h-screen flex items-center overflow-hidden" id="hero">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] animate-float" />
            <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-secondary/8 blur-[120px] animate-float delay-300" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[160px]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary-light tracking-wide">PLATFORM EVENT #1 INDONESIA</span>
              </div>

              {/* Heading */}
              <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Booking Booth Event
                <br />
                <span className="gradient-text">Semudah Pilih Kursi Bioskop</span>
              </h1>

              {/* Subheading */}
              <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed opacity-0">
                Hubungkan penyelenggara event dengan pelaku usaha melalui platform interaktif, 
                denah real-time, dan panduan digital berbasis QR — 100% paperless.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
                <Link href="/auth/register" className="btn btn-primary btn-lg" id="hero-cta-register">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Mulai Sekarang — Gratis
                </Link>
                <Link href="/events" className="btn btn-secondary btn-lg" id="hero-cta-explore">
                  Jelajahi Event
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>

              {/* Stats */}
              <div className="animate-fade-in-up delay-500 mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto opacity-0">
                {[
                  { value: "5", label: "Event Demo" },
                  { value: "2", label: "Tenant Demo" },
                  { value: "1", label: "Akun Visitor" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </section>

        {/* ========== FEATURED EVENTS ========== */}
        <section className="py-24 relative" id="featured-events">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="badge badge-primary mb-4">🔥 POPULER</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Event yang Sedang Trending</h2>
              <p className="text-muted max-w-xl mx-auto">Temukan pameran, bazar, dan event terbaik di seluruh Indonesia</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURED_EVENTS.map((event, i) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`card-interactive p-0 overflow-hidden animate-fade-in-up opacity-0`}
                  style={{ animationDelay: `${i * 100}ms` }}
                  id={`event-card-${event.id}`}
                >
                  {/* Event image area */}
                  <div className={`h-40 bg-gradient-to-br ${event.gradient} flex items-center justify-center`}>
                    <span className="text-6xl">{event.image}</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-primary text-[11px]">{event.category}</span>
                    </div>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-1">{event.title}</h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {event.location}
                      </div>
                    </div>
                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Booth terisi</span>
                        <span className="font-semibold text-primary-light">{event.boothsFilled}/{event.boothsTotal}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all duration-500"
                          style={{ width: `${(event.boothsFilled / event.boothsTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/events" className="btn btn-secondary" id="view-all-events">
                Lihat Semua Event
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="py-24 relative" id="features">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[120px]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="badge badge-secondary mb-4">✨ FITUR</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Semua yang Kamu Butuhkan</h2>
              <p className="text-muted max-w-xl mx-auto">Platform lengkap dari pembuatan event hingga transaksi pengunjung di hari acara</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`card-base p-6 animate-fade-in-up opacity-0`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="py-24 relative" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="badge badge-accent mb-4">🚀 CARA KERJA</span>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simpel. Cepat. Efektif.</h2>
              <p className="text-muted max-w-xl mx-auto">Dari pembuatan event hingga hari acara, semuanya digital</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.step} className={`relative card-base p-6 animate-fade-in-up opacity-0`} style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="text-5xl font-black gradient-text opacity-30 mb-4">{step.step}</div>
                  <span className="badge badge-primary text-[10px] mb-3">{step.role}</span>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 text-border">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CTA ========== */}
        <section className="py-24 relative overflow-hidden" id="cta-section">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Siap Membawa Event-mu ke Level Berikutnya?
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
              Bergabung dengan ribuan penyelenggara event dan pelaku usaha yang sudah merasakan kemudahan Boothify.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register?role=organizer" className="btn btn-primary btn-lg animate-pulse-glow" id="cta-register">
                Daftar Sebagai Organizer
              </Link>
              <Link href="/auth/register?role=tenant" className="btn btn-secondary btn-lg" id="cta-tenant">
                Daftar Sebagai Tenant
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
