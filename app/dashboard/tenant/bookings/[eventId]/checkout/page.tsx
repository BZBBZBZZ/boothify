"use client";

import { useState, useEffect, Suspense } from "react";
import { FacilityList } from "@/app/components/BoothFacilities";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import { getEvent, getBooths, listTenantPendingBookings, errorMessage } from "@/app/lib/db";
import { startBoothPayment, fetchPaymentStatus, openSnap } from "@/app/lib/payments-client";
import Icon from "../../../../../components/Icon";
import FreshOnNavigate from "../../../../../components/FreshOnNavigate";

interface CheckoutItem {
  booth: string;
  zone: string;
  price: number;
}

const getZoneDisplay = (zone: string) => {
  const z = zone.toLowerCase();
  if (z.includes("fnb")) return "Kuliner (F&B)";
  if (z.includes("fash")) return "Fashion & Lifestyle";
  if (z.includes("craft")) return "Seni & Kriya";
  if (z.includes("edu")) return "Edukasi & Karir";
  if (z.includes("auto")) return "Otomotif";
  return zone;
};

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params?.eventId as string) || "";
  const boothParam = searchParams.get("booths") || "";
  const { user } = useAuth();
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [facilities, setFacilities] = useState<{ included: string[]; excluded: string[] }>({ included: [], excluded: [] });
  const [payError, setPayError] = useState("");
  // Order code of a payment that was started and is waiting for the server to confirm it
  const [awaitingOrder, setAwaitingOrder] = useState<string | null>(null);

  // The booths come from the link; their prices and availability come from the database
  useEffect(() => {
    let cancelled = false;
    const wanted = boothParam.split(",").map((b) => decodeURIComponent(b).trim()).filter(Boolean);
    Promise.all([
      getEvent(eventId),
      getBooths(eventId),
      user?.id ? listTenantPendingBookings(user.id).catch(() => []) : Promise.resolve([]),
    ])
      .then(([ev, booths, myHolds]) => {
        if (cancelled) return;
        if (ev) {
          setEventTitle(ev.title);
          setEventDate(ev.date);
          setEventLocation(ev.location);
          setFacilities({ included: ev.facilitiesIncluded || [], excluded: ev.facilitiesExcluded || [] });
        }
        const picked = booths.filter((b) => wanted.includes(b.label));
        // Booths this tenant is already holding for an unfinished payment can be paid for again
        const mine = new Set(myHolds.filter((h) => h.eventId === eventId).map((h) => h.booth));
        const taken = picked.filter((b) => b.isBooked && !mine.has(b.label)).map((b) => b.label);
        if (taken.length > 0) {
          setPayError(`Booth ${taken.join(", ")} sudah disewa tenant lain dan dihapus dari pesanan ini.`);
        }
        setItems(picked.filter((b) => !b.isBooked || mine.has(b.label)).map((b) => ({ booth: b.label, zone: getZoneDisplay(b.zone), price: b.price })));
      })
      .catch((err) => {
        if (!cancelled) setPayError(errorMessage(err, "Data pesanan gagal dimuat."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, boothParam, user?.id]);

  // After Snap is opened, only the server can say whether the payment went through
  useEffect(() => {
    if (!awaitingOrder) return;
    let stopped = false;
    let ticks = 0;
    const check = async () => {
      try {
        const info = await fetchPaymentStatus(awaitingOrder);
        if (stopped) return;
        if (info.status === "paid") {
          stopped = true;
          setPaidTotal(info.amount);
          setSuccess(true);
          setAwaitingOrder(null);
        } else if (info.status === "failed" || info.status === "expired" || info.status === "cancelled") {
          stopped = true;
          setPayError(
            info.status === "expired"
              ? "Waktu pembayaran habis dan booth dilepas kembali. Silakan pilih booth lagi."
              : "Pembayaran tidak berhasil. Booth dilepas kembali, silakan coba lagi."
          );
          setAwaitingOrder(null);
        }
      } catch {
        // A single failed check is fine; the next one retries
      }
      ticks += 1;
      if (!stopped && ticks >= 100) {
        stopped = true;
        setAwaitingOrder(null);
        setPayError("Konfirmasi pembayaran belum diterima. Cek status di halaman Booth Saya beberapa saat lagi.");
      }
    };
    void check();
    const timer = setInterval(check, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [awaitingOrder]);

  if (user && user.role !== "tenant") {
    return <div className="card-base p-8 text-center"><h1 className="page-header-title mb-2">Akses khusus tenant</h1><p className="text-sm text-muted-foreground">Silakan masuk menggunakan akun tenant untuk menyewa booth.</p><Link href="/events" className="btn btn-primary btn-sm mt-5">Kembali ke Event</Link></div>;
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Memuat pesanan...</p>;
  }

  if (!success && (!user || items.length === 0)) {
    return <div className="card-base p-8 text-center"><h1 className="page-header-title mb-2">Belum ada booth dipilih</h1><p className="text-sm text-muted-foreground mb-5">{payError || "Pilih booth dari halaman event sebelum melanjutkan pembayaran."}</p><Link href={`/events/${eventId}?tab=booths`} className="btn btn-primary btn-sm">Pilih Booth</Link></div>;
  }

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  // Same rule as book_booths in the database: PPN 11% and Rp 50.000 service fee per booth
  const appliedTax = items.reduce((s, i) => s + Math.round(i.price * 0.11), 0);
  const serviceFee = 50000 * items.length;
  const total = subtotal + appliedTax + serviceFee;

  const handlePay = async () => {
    if (!agreed || processing) return;
    setPayError("");
    setProcessing(true);
    try {
      // The server checks the tenant, holds the booths, and computes every amount from the database
      const session = await startBoothPayment(eventId, items.map((i) => i.booth));
      setAwaitingOrder(session.orderId);
      // Snap's callbacks are only hints. The page moves on when the server confirms payment.
      await openSnap(session.snapToken, {
        onError: () => setPayError("Pembayaran tidak berhasil di Midtrans. Silakan coba lagi."),
      });
    } catch (err) {
      setPayError(errorMessage(err, "Pembayaran gagal diproses."));
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in-up text-center py-16 max-w-md mx-auto" id="checkout-success">
        <div className="text-7xl mb-6"><Icon name="check-circle" size={40} /></div>
        <h1 className="page-header-title mb-3">Pembayaran Berhasil!</h1>
        <p className="text-muted-foreground mb-1">Booth kamu telah resmi terkonfirmasi untuk</p>
        <p className="font-semibold text-lg text-primary-light mb-6">{eventTitle}</p>
        <div className="card-base p-4 mb-6 text-left space-y-2">
          {items.map((item) => (
            <div key={item.booth} className="flex items-center justify-between text-sm">
              <span>Booth {item.booth} ({item.zone})</span>
              <span className="font-medium text-emerald-700">Confirmed &amp; Paid</span>
            </div>
          ))}
          <hr className="border-border" />
          <div className="flex items-center justify-between font-bold">
            <span>Total Dibayar</span>
            <span className="gradient-text">Rp {(paidTotal || total).toLocaleString("id-ID")}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Selanjutnya, kelola menu F&amp;B atau media promosi digital kamu agar langsung tampil kepada pengunjung saat scan denah acara.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/tenant/catalog" className="btn btn-primary btn-lg" id="goto-catalog-btn">
            Isi menu &amp; katalog produk
          </Link>
          <Link href="/dashboard/tenant/mini-website" className="btn btn-secondary" id="goto-mini-website-btn">
            Buat mini website booth
          </Link>
          <Link href={`/events/${eventId}/guide`} className="btn btn-secondary" id="preview-guide-btn">
            Lihat Booth Kamu di Panduan Pengunjung
          </Link>
          <Link href="/dashboard/tenant" className="btn btn-ghost text-xs">
            Kembali ke Dasbor Tenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" id="checkout-page">
      <div className="mb-6">
        <h1 className="page-header-title mb-1">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">Selesaikan pembayaran sewa booth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <div className="card-base p-6">
            <h2 className="section-title mb-4">Detail pesanan</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                <span className="text-2xl"><Icon name="leaf" size={24} /></span>
                <div>
                  <p className="font-medium text-sm">{eventTitle}</p>
                  <p className="text-xs text-muted-foreground">{[eventDate, eventLocation].filter(Boolean).join(" • ")}</p>
                </div>
              </div>
              {items.map((item) => (
                <div key={item.booth} className="flex items-center justify-between p-3 rounded-xl bg-foreground/3">
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

          {/* What the rent includes, so nothing is a surprise on site */}
          <section className="card-base p-6">
            <h2 className="section-title">Fasilitas booth</h2>
            <p className="section-desc mb-4">Pastikan kamu membawa sendiri fasilitas yang tidak disediakan organizer.</p>
            <FacilityList included={facilities.included} excluded={facilities.excluded} />
          </section>

          {/* Payment method is chosen inside Midtrans Snap */}
          <div className="card-base p-6">
            <h2 className="section-title mb-2">Metode pembayaran</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pilih QRIS, e-wallet, transfer bank, atau kartu langsung di jendela pembayaran Midtrans setelah menekan Bayar Sekarang.
              Booth kamu ditahan selama 30 menit sambil menunggu pembayaran.
            </p>
            <p className="text-xs text-muted-foreground mt-3">Mode uji (Midtrans Sandbox): tidak ada uang sungguhan yang dipindahkan.</p>
          </div>
        </div>

        {/* Summary */}
        <div className="card-base p-6 h-fit sticky top-24">
          <h3 className="section-title mb-4">Ringkasan pembayaran</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.length} booth)</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pajak PPN (11%)</span>
              <span>Rp {appliedTax.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between items-center">
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

          {payError && (
            <div className="mt-4 p-3 rounded-lg bg-error/10 text-xs text-error leading-relaxed" role="alert">
              {payError}{" "}
              <Link href={`/events/${eventId}?tab=booths`} className="underline font-semibold">Pilih ulang booth</Link>
            </div>
          )}

          {awaitingOrder && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 text-xs text-muted-foreground leading-relaxed" role="status">
              Menunggu konfirmasi pembayaran dari server. Halaman ini berubah otomatis setelah Midtrans mengonfirmasi.
              Jika jendela pembayaran tertutup, tekan tombol di bawah untuk membukanya lagi.
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={!agreed || processing}
            className={`btn btn-primary w-full btn-lg mt-4 ${(!agreed || processing) ? "opacity-50 cursor-not-allowed" : ""}`}
            id="pay-now-btn"
          >
            {processing ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg> Memproses...</>
            ) : (
              awaitingOrder ? "Buka Pembayaran Midtrans" : "Bayar Sekarang"
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Diproses oleh Midtrans (Sandbox)
          </div>
        </div>
      </div>

      {/* Modal Syarat & Ketentuan */}
      {showTermsModal && (
        <div className="modal-overlay">
          <div className="card-base max-w-lg w-full p-6 relative border border-border shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-lg font-bold">Syarat &amp; Ketentuan Sewa Booth</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-terms-modal"
              aria-label="Tutup"
              >
                <Icon name="x" size={20} />
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
        <div className="modal-overlay">
          <div className="card-base max-w-lg w-full p-6 relative border border-border shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-lg font-bold">Kebijakan Pembatalan &amp; Pengembalian Dana</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-cancel-modal"
              aria-label="Tutup"
              >
                <Icon name="x" size={20} />
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

function CheckoutPageContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

export default function CheckoutPage() {
  return (
    <FreshOnNavigate>
      <CheckoutPageContent />
    </FreshOnNavigate>
  );
}
