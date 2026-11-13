"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import type { AdminCampaign } from "@/app/lib/admin-campaigns";
import { getEvent, getBooths, getEventCampaign, bookBooths, errorMessage } from "@/app/lib/db";
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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [campaign, setCampaign] = useState<AdminCampaign | null>(null);
  const [payError, setPayError] = useState("");

  // The booths come from the link; their prices and availability come from the database
  useEffect(() => {
    let cancelled = false;
    const wanted = boothParam.split(",").map((b) => decodeURIComponent(b).trim()).filter(Boolean);
    Promise.all([getEvent(eventId), getBooths(eventId), getEventCampaign(eventId).catch(() => null)])
      .then(([ev, booths, camp]) => {
        if (cancelled) return;
        if (ev) {
          setEventTitle(ev.title);
          setEventDate(ev.date);
          setEventLocation(ev.location);
        }
        setCampaign(camp);
        const picked = booths.filter((b) => wanted.includes(b.label));
        const taken = picked.filter((b) => b.isBooked).map((b) => b.label);
        if (taken.length > 0) {
          setPayError(`Booth ${taken.join(", ")} sudah disewa tenant lain dan dihapus dari pesanan ini.`);
        }
        setItems(picked.filter((b) => !b.isBooked).map((b) => ({ booth: b.label, zone: getZoneDisplay(b.zone), price: b.price })));
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
  }, [eventId, boothParam]);

  if (user && user.role !== "tenant") {
    return <div className="card-base p-8 text-center"><h1 className="text-xl font-bold mb-2">Akses khusus tenant</h1><p className="text-sm text-muted-foreground">Silakan masuk menggunakan akun tenant untuk menyewa booth.</p><Link href="/events" className="btn btn-primary btn-sm mt-5">Kembali ke Event</Link></div>;
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Memuat pesanan...</p>;
  }

  if (!success && (!user || items.length === 0)) {
    return <div className="card-base p-8 text-center"><h1 className="text-xl font-bold mb-2">Belum ada booth dipilih</h1><p className="text-sm text-muted-foreground mb-5">{payError || "Pilih booth dari halaman event sebelum melanjutkan pembayaran."}</p><Link href={`/events/${eventId}?tab=booths`} className="btn btn-primary btn-sm">Pilih Booth</Link></div>;
  }

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const isFreeTax = Boolean(campaign);
  const standardTax = items.reduce((s, i) => s + Math.round(i.price * 0.11), 0); // PPN 11% per booth
  const appliedTax = isFreeTax ? 0 : standardTax;
  const standardFee = 50000 * items.length;
  const serviceFee = isFreeTax ? 0 : standardFee;
  const total = subtotal + appliedTax + serviceFee;

  const handlePay = async () => {
    if (!paymentMethod || !agreed || processing) return;
    setPayError("");
    setProcessing(true);
    try {
      // The database re-checks every booth, so two tenants can never rent the same one
      const booked = await bookBooths(eventId, items.map((i) => i.booth), paymentMethod);
      setPaidTotal(booked.reduce((sum, b) => sum + b.total, 0));
      setSuccess(true);
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
        <h1 className="text-2xl font-bold mb-3">Pembayaran Berhasil!</h1>
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
            Kelola Katalog Produk &amp; Mini Website
          </Link>
          <Link href={`/events/${eventId}/guide`} className="btn btn-secondary" id="preview-guide-btn">
            Lihat Booth Kamu di Panduan Pengunjung
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

          {/* Payment Method */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-4">Metode Pembayaran</h2>
            <div className="space-y-2">
              {[
                { id: "qris", label: "QRIS (Scan)" },
                { id: "gopay", label: "GoPay" },
                { id: "ovo", label: "OVO" },
                { id: "shopeepay", label: "ShopeePay" },
                { id: "bca", label: "Transfer Bank BCA" },
                { id: "mandiri", label: "Transfer Bank Mandiri" },
                { id: "cc", label: "Kartu Kredit / Debit" },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? "bg-primary/5 border-2 border-primary"
                      : "bg-foreground/[0.02] border-2 border-transparent hover:bg-foreground/[0.04]"
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
                  <Icon name={method.id === "qris" ? "phone" : method.id === "cc" ? "card" : method.id === "bca" || method.id === "mandiri" ? "bank" : "wallet"} size={20} />
                  <span className="text-sm font-medium">{method.label}</span>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.id ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {paymentMethod === method.id && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1e2a4a" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
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

          {/* Campaign Free Tax Highlight Banner */}
          {isFreeTax && (
            <div className="p-3.5 rounded-xl bg-success/10 border border-emerald-500/30 text-xs mb-4 space-y-1">
              <div className="flex items-center justify-between font-bold text-success">
                <span className="flex items-center gap-1.5">
                  <span><Icon name="gift" size={16} /></span> Bebas Pajak (Free Tax 0%)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40">
                  Resmi Admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Event ini tergabung dalam <strong>{campaign?.title}</strong>. Pajak PPN 11% dan biaya layanan bebas biaya.
              </p>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({items.length} booth)</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pajak PPN (11%)</span>
              {isFreeTax ? (
                <div className="text-right">
                  <span className="line-through text-xs text-muted-foreground mr-1.5">
                    Rp {standardTax.toLocaleString("id-ID")}
                  </span>
                  <span className="font-bold text-success">Rp 0 (Free Tax)</span>
                </div>
              ) : (
                <span>Rp {appliedTax.toLocaleString("id-ID")}</span>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Biaya Layanan</span>
              {isFreeTax ? (
                <div className="text-right">
                  <span className="line-through text-xs text-muted-foreground mr-1.5">Rp {standardFee.toLocaleString("id-ID")}</span>
                  <span className="font-bold text-success">Rp 0 (Disubsidi)</span>
                </div>
              ) : (
                <span>Rp {serviceFee.toLocaleString("id-ID")}</span>
              )}
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-lg w-full p-6 relative border border-border/80 shadow-2xl max-h-[85vh] overflow-y-auto">
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
