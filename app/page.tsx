import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeFloorPlan from "./components/HomeFloorPlan";
import HomeRoles from "./components/HomeRoles";
import HomeFeaturedEvents from "./components/HomeFeaturedEvents";

const STEPS = [
  {
    title: "Buat atau Cari Event",
    description: "Organizer membuat event dan denah; tenant mencari yang cocok.",
    role: "Organizer & Tenant",
  },
  {
    title: "Pilih & Booking Booth",
    description: "Pilih posisi di denah interaktif, lalu bayar langsung.",
    role: "Tenant",
  },
  {
    title: "Atur Katalog & Media",
    description: "Unggah menu F&B, atau brosur, galeri dan video.",
    role: "Tenant",
  },
  {
    title: "Hari Event, Scan & Go",
    description: "Scan QR: denah, menu dan info booth dari HP.",
    role: "Pengunjung",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="home">
        {/* ========== HERO: the desk, the floor plan laid on it as stationery ========== */}
        <section className="home-hero" id="hero">
          <div className="container home-hero-inner">
            <div className="home-hero-text">
              <h1 className="home-hero-head">Booking booth event semudah pilih kursi bioskop.</h1>
              <p className="lead home-hero-lead">
                Denah real-time dan panduan QR untuk penyelenggara dan pelaku usaha, 100% paperless.
              </p>
              <div className="home-hero-actions">
                <Link href="/auth/register" className="btn btn-primary btn-lg" id="hero-cta-register">
                  Mulai Sekarang, Gratis
                </Link>
                <Link href="/events" className="btn btn-secondary btn-lg" id="hero-cta-explore">
                  Jelajahi Event
                </Link>
              </div>
            </div>

            <HomeFloorPlan />
          </div>
        </section>

        {/* ========== FEATURED EVENTS: a ledger sheet ========== */}
        <section className="home-events" id="featured-events">
          <div className="container">
            <div className="home-head home-head--split">
              <h2>Event yang akan datang</h2>
              <p className="lead">Temukan pameran, bazar, dan event terbaik di seluruh Indonesia.</p>
            </div>

            <div className="ledger">
              <HomeFeaturedEvents />
              <div className="ledger-foot">
                <Link href="/events" className="btn btn-secondary" id="view-all-events">
                  Lihat Semua Event
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FEATURES: what each side of the booth gets ========== */}
        <section className="home-features" id="features">
          <div className="container">
            <div className="home-head">
              <h2>Semua yang kamu butuhkan</h2>
              <p className="lead">Dari pembuatan event hingga transaksi pengunjung di hari acara.</p>
            </div>
            <HomeRoles />
          </div>
        </section>

        {/* ========== HOW IT WORKS: four index cards on the desk ========== */}
        <section className="home-route" id="how-it-works">
          <div className="container">
            <div className="home-head">
              <h2>Denah, booking, katalog, scan.</h2>
              <p className="lead">Dari pembuatan event hingga hari acara, semuanya digital.</p>
            </div>

            <ol className="index-cards" aria-label="Alur Boothify dari event sampai hari acara">
              {STEPS.map((step) => (
                <li key={step.title} className="index-card">
                  <h3 className="index-card-title">{step.title}</h3>
                  <p className="index-card-text">{step.description}</p>
                  <p className="index-card-role">Untuk {step.role}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ========== CLOSE: the board, one card per role laid on it ========== */}
        <section className="home-close" id="cta-section">
          <div className="container home-close-inner">
            <div className="home-close-text">
              <h2>Siap membawa event-mu ke level berikutnya?</h2>
              <p className="lead">
                Kelola pendaftaran booth, katalog tenant, dan informasi pengunjung dari satu tempat.
              </p>
            </div>

            <div className="home-close-cards">
              <div className="close-card close-card--organizer">
                <h3>Organizer</h3>
                <p>Buat denah, atur zona, pantau ketersediaan booth.</p>
                <Link href="/auth/register?role=organizer" className="btn btn-primary btn-lg" id="cta-register">
                  Daftar Sebagai Organizer
                </Link>
              </div>
              <div className="close-card close-card--tenant">
                <h3>Tenant</h3>
                <p>Cari event, pilih posisi booth, bayar langsung.</p>
                <Link href="/auth/register?role=tenant" className="btn btn-secondary btn-lg" id="cta-tenant">
                  Daftar Sebagai Tenant
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
