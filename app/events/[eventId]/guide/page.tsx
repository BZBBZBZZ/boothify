"use client";

import { useState } from "react";

// Mock data
const EVENT = {
  title: "Green Fashion Expo 2026",
  date: "15–17 November 2026",
  location: "Jakarta Convention Center, Hall A",
};

const BOOTHS = [
  { id: "A1", name: "EcoWear Studio", category: "Fashion", zone: "A", type: "non-fnb", desc: "Brand fashion daur ulang premium dari Bandung", media: ["brosur.pdf", "galeri-produk.jpg"], website: "https://ecowear.id" },
  { id: "A2", name: "Green Threads", category: "Fashion", zone: "A", type: "non-fnb", desc: "Pakaian berbahan organik dan ramah lingkungan", media: ["lookbook.pdf"], website: "https://greenthreads.co" },
  { id: "B2", name: "Nusantara Bites", category: "F&B", zone: "B", type: "fnb", desc: "Street food khas Nusantara yang autentik", menu: [
    { name: "Nasi Goreng Kampung", price: 25000, image: "🍛" },
    { name: "Sate Ayam Madura", price: 20000, image: "🍢" },
    { name: "Es Cendol Segar", price: 12000, image: "🥤" },
    { name: "Pisang Goreng Crispy", price: 15000, image: "🍌" },
  ]},
  { id: "C1", name: "Kopi Keliling", category: "F&B", zone: "C", type: "fnb", desc: "Specialty coffee from local farmers", menu: [
    { name: "V60 Single Origin", price: 30000, image: "☕" },
    { name: "Iced Latte", price: 25000, image: "🧊" },
    { name: "Matcha Latte", price: 28000, image: "🍵" },
  ]},
  { id: "C3", name: "CraftHouse", category: "Craft", zone: "C", type: "non-fnb", desc: "Kerajinan tangan premium dari pengrajin lokal", media: ["catalog.pdf", "workshop-info.jpg"], website: "https://crafthouse.id" },
  { id: "D4", name: "EduTech Lab", category: "Education", zone: "D", type: "non-fnb", desc: "Workshop teknologi dan coding interaktif untuk semua usia", media: ["jadwal-workshop.pdf", "pricing.pdf"], website: "https://edutechlab.com" },
];

const BOOTH_ROWS = ["A", "B", "C", "D"];
const BOOTHS_PER_ROW = 6;

type CartItem = { boothId: string; name: string; price: number; qty: number };

export default function EventGuidePage() {
  const [selectedBooth, setSelectedBooth] = useState<typeof BOOTHS[0] | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const addToCart = (boothId: string, name: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.boothId === boothId && i.name === name);
      if (existing) {
        return prev.map((i) => i.boothId === boothId && i.name === name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { boothId, name, price, qty: 1 }];
    });
  };

  const removeFromCart = (boothId: string, name: string) => {
    setCart((prev) => prev.filter((i) => !(i.boothId === boothId && i.name === name)));
  };

  const updateQty = (boothId: string, name: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.boothId === boothId && i.name === name) {
          const newQty = i.qty + delta;
          return newQty <= 0 ? i : { ...i, qty: newQty };
        }
        return i;
      }).filter((i) => i.qty > 0)
    );
  };

  const totalCart = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const boothMap = Object.fromEntries(BOOTHS.map((b) => [b.id, b]));

  const getBoothInfo = (row: string, col: number) => {
    const id = `${row}${col}`;
    return boothMap[id] || null;
  };

  return (
    <div className="min-h-screen bg-background" id="event-guide-page">
      {/* Top bar */}
      <div className="glass fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold">{EVENT.title}</h1>
            <p className="text-xs text-muted-foreground">{EVENT.location}</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative btn btn-primary btn-sm"
            id="cart-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-20 pb-8">
        {/* Event info */}
        <div className="card-base p-4 mb-6 text-center">
          <span className="text-4xl mb-2 block">🌿</span>
          <h2 className="font-bold text-lg">{EVENT.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{EVENT.date} • {EVENT.location}</p>
        </div>

        {/* Interactive Floor Plan */}
        <div className="card-base p-4 mb-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            Denah Acara — Tap booth untuk detail
          </h3>

          {/* Stage */}
          <div className="text-center mb-4">
            <div className="inline-block px-10 py-2 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/15 border border-border text-xs font-semibold text-muted-foreground">
              🎤 PANGGUNG
            </div>
          </div>

          {/* Grid */}
          <div className="space-y-2">
            {BOOTH_ROWS.map((row) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-4 text-[10px] font-bold text-muted-foreground">{row}</span>
                <div className="flex items-center gap-1.5 flex-1 justify-center">
                  {Array.from({ length: BOOTHS_PER_ROW }).map((_, i) => {
                    const info = getBoothInfo(row, i + 1);
                    const isOccupied = !!info;
                    return (
                      <button
                        key={i}
                        onClick={() => info && setSelectedBooth(info)}
                        className={`w-11 h-11 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${
                          isOccupied
                            ? info.type === "fnb"
                              ? "bg-zone-fnb/15 border border-zone-fnb/40 text-zone-fnb hover:scale-110 cursor-pointer"
                              : "bg-secondary/15 border border-secondary/40 text-secondary-light hover:scale-110 cursor-pointer"
                            : "bg-white/3 border border-white/8 text-muted-foreground/50"
                        }`}
                        disabled={!isOccupied}
                        id={`guide-booth-${row}${i + 1}`}
                      >
                        {isOccupied ? info.id : `${row}${i + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-zone-fnb/30 border border-zone-fnb/50" /> F&B (Pesan)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-secondary/30 border border-secondary/50" /> Info / Media</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white/5 border border-white/10" /> Kosong</div>
          </div>
        </div>

        {/* Tenant Directory */}
        <h3 className="font-semibold text-sm mb-3">Direktori Tenant</h3>
        <div className="space-y-3">
          {BOOTHS.map((booth) => (
            <button
              key={booth.id}
              onClick={() => setSelectedBooth(booth)}
              className="w-full card-interactive p-4 text-left"
              id={`tenant-dir-${booth.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                  booth.type === "fnb" ? "bg-zone-fnb/15 text-zone-fnb" : "bg-secondary/15 text-secondary-light"
                }`}>
                  {booth.id}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{booth.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{booth.desc}</p>
                </div>
                <span className={`badge text-[10px] ${booth.type === "fnb" ? "bg-zone-fnb/15 text-zone-fnb" : "badge-secondary"}`}>
                  {booth.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========== BOOTH DETAIL MODAL ========== */}
      {selectedBooth && (
        <div className="modal-overlay" onClick={() => setSelectedBooth(null)} id="booth-detail-modal">
          <div className="modal-content max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  selectedBooth.type === "fnb" ? "bg-zone-fnb/20 text-zone-fnb" : "bg-secondary/20 text-secondary-light"
                }`}>
                  {selectedBooth.id}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedBooth.name}</h2>
                  <p className="text-xs text-muted-foreground">Booth {selectedBooth.id} • {selectedBooth.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooth(null)} className="btn btn-ghost btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <p className="text-sm text-muted mb-6">{selectedBooth.desc}</p>

            {/* F&B Menu */}
            {selectedBooth.type === "fnb" && "menu" in selectedBooth && (
              <div>
                <h3 className="font-semibold text-sm mb-3">📋 Menu — Pesan & Bayar</h3>
                <div className="space-y-3">
                  {selectedBooth.menu.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                      <span className="text-2xl">{item.image}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-primary-light font-semibold">Rp {item.price.toLocaleString("id-ID")}</p>
                      </div>
                      <button
                        onClick={() => addToCart(selectedBooth.id, item.name, item.price)}
                        className="btn btn-primary btn-sm"
                        id={`add-${item.name.replace(/\s/g, "-")}`}
                      >
                        + Tambah
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-F&B Media */}
            {selectedBooth.type === "non-fnb" && "media" in selectedBooth && (
              <div>
                <h3 className="font-semibold text-sm mb-3">📁 Media & Brosur Digital</h3>
                <div className="space-y-2 mb-6">
                  {selectedBooth.media.map((file) => (
                    <div key={file} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      </div>
                      <span className="text-sm flex-1">{file}</span>
                      <button className="btn btn-ghost btn-sm text-primary-light">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Unduh
                      </button>
                    </div>
                  ))}
                </div>
                {"website" in selectedBooth && selectedBooth.website && (
                  <a
                    href={selectedBooth.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                    Kunjungi Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== CART MODAL ========== */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)} id="cart-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">🛒 Keranjang Belanja</h2>
              <button onClick={() => setShowCart(false)} className="btn btn-ghost btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl mb-3 block">🛒</span>
                <p className="text-sm text-muted-foreground">Keranjang masih kosong</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={`${item.boothId}-${item.name}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Booth {item.boothId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.boothId, item.name, -1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold hover:bg-white/10">−</button>
                        <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.boothId, item.name, 1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold hover:bg-white/10">+</button>
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </span>
                      <button onClick={() => removeFromCart(item.boothId, item.name)} className="text-error hover:text-red-400 transition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <hr className="border-border my-4" />
                <div className="flex items-center justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span className="gradient-text">Rp {totalCart.toLocaleString("id-ID")}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="btn btn-primary w-full btn-lg"
                  id="cart-checkout"
                >
                  Bayar Sekarang
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== CHECKOUT MODAL ========== */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)} id="checkout-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">💳 Pembayaran</h2>
              <button onClick={() => setShowCheckout(false)} className="btn btn-ghost btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-3xl font-bold gradient-text mt-1">Rp {totalCart.toLocaleString("id-ID")}</p>
              </div>

              <h3 className="font-semibold text-sm">Pilih Metode Pembayaran</h3>
              <div className="space-y-2">
                {["QRIS", "GoPay", "OVO", "ShopeePay", "Transfer Bank (BCA)", "Kartu Kredit/Debit"].map((method) => (
                  <label key={method} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 cursor-pointer hover:bg-white/5 transition">
                    <input type="radio" name="payment" className="accent-[var(--primary)]" />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={() => { setShowCheckout(false); setCart([]); alert("Pembayaran berhasil! (Demo)"); }}
                className="btn btn-primary w-full btn-lg mt-4"
                id="confirm-payment"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
