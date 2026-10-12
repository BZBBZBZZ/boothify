"use client";

import { useState, useEffect } from "react";

interface CheckoutItem {
  booth: string;
  zone: string;
  price: number;
}

const DEFAULT_ITEMS: CheckoutItem[] = [
  { booth: "A2", zone: "Fashion", price: 2500000 },
  { booth: "A4", zone: "Fashion", price: 2500000 },
];

export default function CheckoutPage() {
  const [items, setItems] = useState<CheckoutItem[]>(DEFAULT_ITEMS);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_checkout_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const serviceFee = 50000;
  const total = subtotal + serviceFee;

  const handlePay = () => {
    if (!paymentMethod || !agreed) return;
    setProcessing(true);
    setTimeout(() => {
      // Persist booked booths
      try {
        const storedBooked = JSON.parse(localStorage.getItem("boothify_booked_booths") || "[]");
        const newBooked = Array.from(new Set([...storedBooked, ...items.map((i) => i.booth)]));
        localStorage.setItem("boothify_booked_booths", JSON.stringify(newBooked));

        // Persist to tenant bookings
        const storedBookings = JSON.parse(localStorage.getItem("boothify_tenant_bookings") || "[]");
        items.forEach((item) => {
          storedBookings.unshift({
            event: "Green Fashion Expo 2026",
            booth: item.booth,
            date: "15–17 Nov 2026",
            status: "confirmed",
            payment: "paid",
            amount: `Rp ${item.price.toLocaleString("id-ID")}`,
            time: "Baru saja",
          });
        });
        localStorage.setItem("boothify_tenant_bookings", JSON.stringify(storedBookings));

        // Persist to recent bookings (for organizer)
        const recentBookings = JSON.parse(localStorage.getItem("boothify_recent_bookings") || "[]");
        items.forEach((item) => {
          recentBookings.unshift({
            tenant: "EcoWear Studio",
            event: "Green Fashion Expo",
            booth: item.booth,
            amount: `Rp ${item.price.toLocaleString("id-ID")}`,
            time: "Baru saja",
            status: "paid",
          });
        });
        localStorage.setItem("boothify_recent_bookings", JSON.stringify(recentBookings));
      } catch (err) {
        console.error("Failed to save booking:", err);
      }

      setProcessing(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="animate-fade-in-up text-center py-16 max-w-md mx-auto" id="checkout-success">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-3">Pembayaran Berhasil!</h1>
        <p className="text-muted-foreground mb-2">Booth kamu telah dikonfirmasi untuk</p>
        <p className="font-semibold text-lg mb-6">Green Fashion Expo 2026</p>
        <div className="card-base p-4 mb-6 text-left space-y-2">
          {items.map((item) => (
            <div key={item.booth} className="flex items-center justify-between text-sm">
              <span>Booth {item.booth} ({item.zone})</span>
              <span className="font-medium">✓ Confirmed</span>
            </div>
          ))}
          <hr className="border-border" />
          <div className="flex items-center justify-between font-bold">
            <span>Total Dibayar</span>
            <span className="gradient-text">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Selanjutnya, upload katalog produk dan media promosi kamu untuk ditampilkan kepada pengunjung.</p>
        <div className="flex flex-col gap-3">
          <a href="/dashboard/tenant/catalog" className="btn btn-primary btn-lg">Upload Katalog Produk →</a>
          <a href="/dashboard/tenant" className="btn btn-secondary">Kembali ke Dashboard</a>
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
                  <p className="font-medium text-sm">Green Fashion Expo 2026</p>
                  <p className="text-xs text-muted-foreground">15–17 November 2026 • Jakarta Convention Center</p>
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
              Saya menyetujui <a href="#" className="text-primary-light underline">Syarat & Ketentuan</a> serta <a href="#" className="text-primary-light underline">Kebijakan Pembatalan</a>
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
    </div>
  );
}
