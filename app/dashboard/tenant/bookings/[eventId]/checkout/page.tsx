"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { DEFAULT_EVENTS_META } from "@/app/lib/event-defaults";

interface CheckoutItem {
  booth: string;
  zone: string;
  price: number;
}

const DEFAULT_ITEMS: CheckoutItem[] = [
  { booth: "A2", zone: "Fashion", price: 2500000 },
  { booth: "A4", zone: "Fashion", price: 2500000 },
];

function CheckoutContent() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user } = useAuth();
  const [items, setItems] = useState<CheckoutItem[]>(DEFAULT_ITEMS);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("Green Fashion Expo 2026");
  const [eventDate, setEventDate] = useState("15–17 Nov 2026");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_checkout_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }

      // Load event details
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const found = storedEvents.find((e: { id: string; title: string; date: string }) => String(e.id) === String(eventId));
      if (found) {
        setEventTitle(found.title);
        if (found.date) setEventDate(found.date);
      } else {
        const fallback = DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"];
        setEventTitle(fallback.title);
        setEventDate(fallback.date);
      }
    } catch {
      // ignore
    }
  }, [eventId]);

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const serviceFee = 50000;
  const total = subtotal + serviceFee;

  const handlePay = () => {
    if (!paymentMethod || !agreed) return;
    setProcessing(true);
    setTimeout(() => {
      try {
        // Get tenant brand name & email
        const tenantProfile = JSON.parse(localStorage.getItem(`boothify_profile_${user?.email}`) || localStorage.getItem("boothify_tenant_profile") || "{}");
        const currentUser = JSON.parse(localStorage.getItem("boothify_current_user") || "{}");
        const tenantEmail = user?.email || currentUser.email || "demo-tenant@boothify.id";
        const tenantBrand = user?.businessName || tenantProfile.brandName || currentUser.businessName || user?.name || "EcoWear Studio";

        // Persist booked booths per-event and global
        const storedBooked = JSON.parse(localStorage.getItem("boothify_booked_booths") || "[]");
        const newBooked = Array.from(new Set([...storedBooked, ...items.map((i) => i.booth)]));
        localStorage.setItem("boothify_booked_booths", JSON.stringify(newBooked));

        const storedEventBooked = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_booked_booths`) || "[]");
        const newEventBooked = Array.from(new Set([...storedEventBooked, ...items.map((i) => i.booth)]));
        localStorage.setItem(`boothify_event_${eventId}_booked_booths`, JSON.stringify(newEventBooked));

        // Map booth to tenant brand for digital guide
        const storedBoothTenants = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_booth_tenants`) || "{}");
        items.forEach((item) => {
          storedBoothTenants[item.booth] = {
            id: item.booth,
            name: tenantBrand,
            tenantEmail: tenantEmail,
            category: user?.category || tenantProfile.category || item.zone || "Fashion",
            zone: item.zone || item.booth.charAt(0),
            type: (user?.category === "fnb" || item.zone === "F&B" || tenantEmail === "kopi@boothify.id") ? "fnb" : "non-fnb",
            desc: tenantProfile.description || `${tenantBrand} terdaftar resmi di event ini.`,
          };
        });
        localStorage.setItem(`boothify_event_${eventId}_booth_tenants`, JSON.stringify(storedBoothTenants));

        // Persist to tenant bookings (scoped by tenantEmail)
        const storedBookings = JSON.parse(localStorage.getItem("boothify_tenant_bookings") || "[]");
        items.forEach((item) => {
          storedBookings.unshift({
            eventId,
            event: eventTitle,
            booth: item.booth,
            date: eventDate,
            status: "confirmed",
            payment: "paid",
            amount: `Rp ${item.price.toLocaleString("id-ID")}`,
            time: "Baru saja",
            tenantEmail: tenantEmail,
            tenantName: tenantBrand,
          });
        });
        localStorage.setItem("boothify_tenant_bookings", JSON.stringify(storedBookings));

        // Persist to recent bookings (for organizer)
        const recentBookings = JSON.parse(localStorage.getItem("boothify_recent_bookings") || "[]");
        items.forEach((item) => {
          recentBookings.unshift({
            tenant: tenantBrand,
            tenantEmail: tenantEmail,
            eventId: eventId,
            event: eventTitle,
            booth: item.booth,
            amount: `Rp ${item.price.toLocaleString("id-ID")}`,
            time: "Baru saja",
            status: "paid",
          });
        });
        localStorage.setItem("boothify_recent_bookings", JSON.stringify(recentBookings));

        // Update organizer events stats: increase boothsFilled
        const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
        const updatedEvents = storedEvents.map((ev: { id: string; boothsFilled: number }) => {
          if (ev.id === eventId) {
            return { ...ev, boothsFilled: (ev.boothsFilled || 0) + items.length };
          }
          return ev;
        });
        localStorage.setItem("boothify_events", JSON.stringify(updatedEvents));
      } catch (err) {
        console.error("Failed to save booking:", err);
      }

      setProcessing(false);
      setSuccess(true);
    }, 1200);
  };

  if (success) {
    return (
      <div className="animate-fade-in-up text-center py-16 max-w-md mx-auto" id="checkout-success">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-3">Pembayaran Berhasil!</h1>
        <p className="text-muted-foreground mb-1">Booth kamu telah resmi terkonfirmasi untuk</p>
        <p className="font-semibold text-lg text-primary-light mb-6">{eventTitle}</p>
        <div className="card-base p-4 mb-6 text-left space-y-2">
          {items.map((item) => (
            <div key={item.booth} className="flex items-center justify-between text-sm">
              <span>Booth {item.booth} ({item.zone})</span>
              <span className="font-medium text-emerald-400">✓ Confirmed &amp; Paid</span>
            </div>
          ))}
          <hr className="border-border" />
          <div className="flex items-center justify-between font-bold">
            <span>Total Dibayar</span>
            <span className="gradient-text">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Selanjutnya, kelola menu F&amp;B atau media promosi digital kamu agar langsung tampil kepada pengunjung saat scan denah acara.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/tenant/catalog" className="btn btn-primary btn-lg" id="goto-catalog-btn">
            Kelola Katalog Produk &amp; Mini Website →
          </Link>
          <Link href={`/events/${eventId}/guide`} className="btn btn-secondary" id="preview-guide-btn">
            📱 Lihat Booth Kamu di Panduan Pengunjung
          </Link>
          <Link href="/dashboard/tenant" className="btn btn-ghost text-xs">
            Kembali ke Dashboard Tenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" id="checkout-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">Selesaikan pembayaran sewa booth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4">Detail Pesanan</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                <span className="text-2xl">🌿</span>
                <div>
                  <p className="font-medium text-sm">{eventTitle}</p>
                  <p className="text-xs text-muted-foreground">{eventDate} • Venue Resmi Acara</p>
                </div>
              </div>
              {items.map((item) => (
                <div key={item.booth} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary-light">{item.booth}</div>
                    <div>
                      <p className="text-sm font-medium">Booth {item.booth}</p>
                      <p className="text-xs text-muted-foreground">Zona {item.zone}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">Rp {item.price.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4">Metode Pembayaran</h2>
            <div className="space-y-2">
              {[
                { id: "qris", label: "QRIS (Scan)", icon: "📱" },
                { id: "gopay", label: "GoPay", icon: "💚" },
                { id: "ovo", label: "OVO", icon: "💜" },
                { id: "shopeepay", label: "ShopeePay", icon: "🧡" },
                { id: "bca", label: "Transfer Bank BCA", icon: "🏦" },
                { id: "mandiri", label: "Transfer Bank Mandiri", icon: "🏦" },
                { id: "cc", label: "Kartu Kredit / Debit", icon: "💳" },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? "bg-primary/5 border-2 border-primary"
                      : "bg-white/[0.02] border-2 border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="sr-only"
                  />
                  <span className="text-xl">{method.icon}</span>
                  <span className="text-sm font-medium">{method.label}</span>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.id ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {paymentMethod === method.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card-base p-6 h-fit sticky top-24">
          <h3 className="font-semibold mb-4">Ringkasan Pembayaran</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.length} booth)</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Biaya Layanan</span>
              <span>Rp {serviceFee.toLocaleString("id-ID")}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="gradient-text">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <label className="flex items-start gap-2 mt-6 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[var(--primary)]" />
            <span className="text-xs text-muted-foreground">
              Saya menyetujui{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                className="text-primary-light underline hover:text-primary transition font-medium"
                id="btn-open-terms"
              >
                Syarat &amp; Ketentuan
              </button>{" "}
              serta{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowCancelModal(true); }}
                className="text-primary-light underline hover:text-primary transition font-medium"
                id="btn-open-cancellation"
              >
                Kebijakan Pembatalan
              </button>
            </span>
          </label>

          <button
            onClick={handlePay}
            disabled={!paymentMethod || !agreed || processing}
            className={`btn btn-primary w-full btn-lg mt-4 ${(!paymentMethod || !agreed || processing) ? "opacity-50 cursor-not-allowed" : ""}`}
            id="pay-now-btn"
          >
            {processing ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg> Memproses...</>
            ) : (
              "Bayar Sekarang"
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Pembayaran aman & terenkripsi
          </div>
        </div>
      </div>

      {/* Modal Syarat & Ketentuan */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-lg w-full p-6 relative border border-border/80 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-lg font-bold">Syarat &amp; Ketentuan Sewa Booth</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-terms-modal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground text-sm">1. Hak &amp; Penggunaan Booth</p>
              <p>Setiap booth berhak digunakan sesuai nomor booth dan zona yang dipilih pada saat checkout. Penyewa tidak diperkenankan memindahtangankan booth tanpa persetujuan tertulis dari pihak penyelenggara.</p>
              
              <p className="font-semibold text-foreground text-sm pt-2">2. Fasilitas &amp; Kelistrikan</p>
              <p>Penyewa booth standar mendapatkan alokasi daya 2A / 450 Watt, 1 meja, dan 2 kursi lipat. Penambahan daya atau fasilitas wajib dikonfirmasikan H-7 sebelum loading-in event.</p>

              <p className="font-semibold text-foreground text-sm pt-2">3. Waktu Loading In / Out</p>
              <p>Loading in dimulai H-1 event pukul 13:00 - 22:00 WIB. Semua materi promosi dan booth dekorasi harus sudah bersih pada H+1 maksimal pukul 04:00 dini hari.</p>
            </div>
            <div className="mt-6 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="btn btn-primary btn-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kebijakan Pembatalan */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-lg w-full p-6 relative border border-border/80 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-lg font-bold">Kebijakan Pembatalan &amp; Pengembalian Dana</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-cancel-modal"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary-light">
                Kebijakan pengembalian dana (refund) diproses melalui sistem otomatis Boothify Escrow.
              </div>
              <p className="font-semibold text-foreground text-sm">1. Pembatalan H-14 Sebelum Event</p>
              <p>Pengembalian dana 100% (dikurangi biaya administrasi payment gateway Rp 50.000).</p>
              
              <p className="font-semibold text-foreground text-sm pt-2">2. Pembatalan H-7 Sebelum Event</p>
              <p>Pengembalian dana sebesar 50% dari total nilai transaksi sewa booth.</p>

              <p className="font-semibold text-foreground text-sm pt-2">3. Pembatalan Kurang dari H-7</p>
              <p>Tidak ada pengembalian dana (non-refundable), namun tenant diperkenankan mengalihkan hak booth ke rekan brand sejenis dengan verifikasi organizer.</p>
            </div>
            <div className="mt-6 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn btn-primary btn-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
