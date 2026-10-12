"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../components/AuthContext";

// Mock data
const EVENT = {
  title: "Green Fashion Expo 2026",
  date: "15–17 November 2026",
  location: "Jakarta Convention Center, Hall A",
};

interface MenuItem {
  name: string;
  price: number;
  image: string;
}

interface BrandingInfo {
  headline: string;
  tagline: string;
  aboutText: string;
  primaryColor: string;
  instagram: string;
  website: string;
  highlights?: string[];
}

interface Booth {
  id: string;
  name: string;
  category: string;
  zone: string;
  type: "fnb" | "non-fnb";
  desc: string;
  media?: string[];
  website?: string;
  menu?: MenuItem[];
  branding?: BrandingInfo;
}

const BOOTHS: Booth[] = [
  {
    id: "A1",
    name: "EcoWear Studio",
    category: "Fashion",
    zone: "A",
    type: "non-fnb",
    desc: "Brand fashion daur ulang premium dari Bandung",
    media: ["brosur-ecowear-2026.pdf", "koleksi-daur-ulang.jpg"],
    website: "https://ecowear.id",
    branding: {
      headline: "EcoWear Studio",
      tagline: "Fashion yang Merawat Masa Depan Bumi 🌿",
      aboutText: "Kami adalah inisiatif busana sirkular berkelanjutan yang memanfaatkan 100% serat tekstil daur ulang dan pewarna alami tumbuhan. Kolaborasi bersama pengrajin tenun lokal Jawa Barat.",
      primaryColor: "#10b981",
      instagram: "@ecowearstudio",
      website: "https://ecowear.id",
      highlights: ["100% Daur Ulang", "Pewarna Alami", "Fair Trade Verified", "Zero Waste Packaging"],
    },
  },
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
  {
    id: "C3",
    name: "CraftHouse",
    category: "Craft",
    zone: "C",
    type: "non-fnb",
    desc: "Kerajinan tangan premium dari pengrajin lokal",
    media: ["catalog.pdf", "workshop-info.jpg"],
    website: "https://crafthouse.id",
    branding: {
      headline: "CraftHouse Indonesia",
      tagline: "Sentuhan Jiwa dalam Karya Seni Anyaman Tradisional",
      aboutText: "Menghubungkan ratusan perajin anyaman bambu dan rotan nusantara dengan pasar modern, mempersembahkan perabot dan dekorasi rumah bergaya etnik minimalis.",
      primaryColor: "#d97706",
      instagram: "@crafthouse.id",
      website: "https://crafthouse.id",
      highlights: ["Anyaman Bambu Alami", "Dibuat Manual dengan Tangan", "Tahan Cuaca", "Pemberdayaan Pengrajin"],
    },
  },
  { id: "D4", name: "EduTech Lab", category: "Education", zone: "D", type: "non-fnb", desc: "Workshop teknologi dan coding interaktif untuk semua usia", media: ["jadwal-workshop.pdf", "pricing.pdf"], website: "https://edutechlab.com" },
];

const BOOTH_ROWS = ["A", "B", "C", "D"];
const BOOTHS_PER_ROW = 6;

type CartItem = { boothId: string; name: string; price: number; qty: number };

function EventGuideContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user, loginAsGuest } = useAuth();
  const [eventInfo, setEventInfo] = useState(EVENT);
  const [boothsList, setBoothsList] = useState<Booth[]>(BOOTHS);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showMiniWebsite, setShowMiniWebsite] = useState(false);
  const [activeMiniWebsite, setActiveMiniWebsite] = useState<BrandingInfo | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("BF-ORDER-8821");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("QRIS");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [activeOrder, setActiveOrder] = useState<{
    id: string;
    status?: string;
    items?: { name: string; qty: number }[];
    total?: number;
  } | null>(null);

  useEffect(() => {
    try {
      // Load event info
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const found = storedEvents.find((e: { id: string; title: string; date: string; location: string }) => e.id === eventId);
      if (found) {
        setEventInfo({
          title: found.title,
          date: found.date,
          location: found.location,
        });
      }

      // Load tenant's menu & mini website
      const storedMenu = JSON.parse(localStorage.getItem("boothify_catalog_menu") || "[]");
      const storedWebsite = JSON.parse(localStorage.getItem("boothify_catalog_website") || "null");

      // Load booths booked for this event by tenants
      const storedBoothTenants = JSON.parse(localStorage.getItem(`boothify_event_${eventId}_booth_tenants`) || "{}");
      
      const mergedBooths = [...BOOTHS];
      Object.keys(storedBoothTenants).forEach((bId) => {
        const tenantInfo = storedBoothTenants[bId];
        const existingIdx = mergedBooths.findIndex((b) => b.id === bId);
        const newEntry: Booth = {
          id: bId,
          name: tenantInfo.name,
          category: tenantInfo.category || "Fashion",
          zone: tenantInfo.zone || bId.charAt(0),
          type: tenantInfo.type || "non-fnb",
          desc: tenantInfo.desc || "Brand terdaftar di event ini",
          menu: tenantInfo.type === "fnb" && storedMenu.length > 0 ? storedMenu : undefined,
          branding: storedWebsite ? {
            headline: storedWebsite.headline || tenantInfo.name,
            tagline: storedWebsite.tagline || "Brand Pilihan",
            aboutText: storedWebsite.aboutText || tenantInfo.desc,
            primaryColor: storedWebsite.primaryColor || "#10b981",
            instagram: storedWebsite.socialLinks?.instagram || "@brand",
            website: storedWebsite.socialLinks?.website || "https://boothify.id",
            highlights: ["Katalog Resmi", "Verified Tenant", "Garansi Kualitas"],
          } : undefined,
        };
        if (existingIdx >= 0) {
          mergedBooths[existingIdx] = newEntry;
        } else {
          mergedBooths.push(newEntry);
        }
      });

      setBoothsList(mergedBooths);
    } catch { /* ignore */ }
  }, [eventId]);

  const handleProceedToPayment = () => {
    if (!user) {
      setShowCart(false);
      setShowAuthGate(true);
    } else {
      setShowCart(false);
      setShowCheckout(true);
    }
  };

  const handleGuestQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest(guestName || "Pengunjung (Tamu)", guestPhone);
    setShowAuthGate(false);
    setShowCheckout(true);
  };

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
  const boothMap = Object.fromEntries(boothsList.map((b) => [b.id, b]));

  useEffect(() => {
    if (!paymentSuccess) return;
    const generatedCode = "BF-ORDER-" + Date.now().toString().slice(-4);
    setOrderCode(generatedCode);
    try {
      const orders = JSON.parse(localStorage.getItem("boothify_visitor_orders") || "[]");
      orders.unshift({
        id: generatedCode,
        eventId,
        items: cart,
        total: totalCart,
        customer: user?.name || guestName || "Pengunjung Tamu",
        phone: user?.phone || guestPhone || "",
        method: selectedPaymentMethod,
        time: "Baru saja",
        status: "pending",
      });
      localStorage.setItem("boothify_visitor_orders", JSON.stringify(orders));

      // Increment tenant incoming orders count
      const curOrders = Number(localStorage.getItem("boothify_tenant_order_count") || "124");
      localStorage.setItem("boothify_tenant_order_count", String(curOrders + 1));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSuccess]);

  // Poll order status updates from tenant
  useEffect(() => {
    const checkOrder = () => {
      try {
        const stored = localStorage.getItem("boothify_visitor_orders");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            const found = list.find((o: { id: string }) => o.id === orderCode) || list[0];
            if (found) {
              setActiveOrder(found);
            }
          }
        }
      } catch {
        // ignore
      }
    };
    checkOrder();
    const interval = setInterval(checkOrder, 2500);
    return () => clearInterval(interval);
  }, [orderCode]);

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
            <h1 className="text-sm font-bold">{eventInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{eventInfo.location}</p>
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
          <h2 className="font-bold text-lg">{eventInfo.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{eventInfo.date} • {eventInfo.location}</p>
        </div>

        {/* Live Order Tracker Banner */}
        {activeOrder && (
          <div
            className={`card-base p-4 mb-6 border transition animate-fade-in ${
              activeOrder.status === "making"
                ? "bg-sky-500/10 border-sky-500/40"
                : activeOrder.status === "ready"
                ? "bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                : activeOrder.status === "done"
                ? "bg-white/[0.02] border-white/10"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
            id="visitor-order-tracker"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {activeOrder.status === "making"
                    ? "🍳"
                    : activeOrder.status === "ready"
                    ? "🔔"
                    : activeOrder.status === "done"
                    ? "✅"
                    : "⏳"}
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status Pesanan #{activeOrder.id}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {activeOrder.status === "making"
                      ? "Sedang Dibuat oleh Merchant"
                      : activeOrder.status === "ready"
                      ? "🎉 SIAP DIAMBIL DI BOOTH!"
                      : activeOrder.status === "done"
                      ? "Pesanan Telah Selesai"
                      : "Menunggu Antrean Pembuatan"}
                  </p>
                </div>
              </div>
              <span
                className={`badge text-[10px] ${
                  activeOrder.status === "ready"
                    ? "badge-primary animate-pulse"
                    : activeOrder.status === "making"
                    ? "badge-secondary"
                    : "badge-accent"
                }`}
              >
                {activeOrder.status === "ready"
                  ? "SIAP!"
                  : activeOrder.status === "making"
                  ? "IN MAKING"
                  : activeOrder.status === "done"
                  ? "DONE"
                  : "PENDING"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeOrder.status === "ready"
                ? "Silakan datangi meja booth Anda dan tunjukkan nomor pesanan untuk mengambil hidangan."
                : activeOrder.status === "making"
                ? "Pesanan Anda sedang dipersiapkan di dapur/booth tenant. Mohon bersabar."
                : "Merchant telah menerima pesanan Anda dan akan segera memprosesnya."}
            </p>
          </div>
        )}

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
        <h3 className="font-semibold text-sm mb-3">Direktori Tenant ({boothsList.length} Brand)</h3>
        <div className="space-y-3">
          {boothsList.map((booth) => (
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
            {selectedBooth.type === "fnb" && selectedBooth.menu && (
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
            {selectedBooth.type === "non-fnb" && (
              <div className="space-y-4">
                {selectedBooth.branding && (
                  <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-secondary text-[10px]">BRANDING SHOWCASE</span>
                      <span className="text-xs text-secondary-light font-semibold">Mini Website Aktif</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{selectedBooth.branding.headline}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{selectedBooth.branding.aboutText}</p>
                    <button
                      onClick={() => {
                        setActiveMiniWebsite(selectedBooth.branding || null);
                        setShowMiniWebsite(true);
                      }}
                      className="btn btn-primary btn-sm w-full"
                      id="open-mini-website-btn"
                    >
                      🌐 Buka Mini Website Brand
                    </button>
                  </div>
                )}

                {selectedBooth.media && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">📁 Media & Brosur Digital (Paperless)</h3>
                    <div className="space-y-2 mb-4">
                      {selectedBooth.media.map((file) => (
                        <div key={file} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          </div>
                          <span className="text-sm flex-1 truncate">{file}</span>
                          <button
                            onClick={() => alert(`Mengunduh digital flyer ${file} (Eco-friendly paperless guide)`)}
                            className="btn btn-ghost btn-sm text-primary-light"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Unduh
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooth.website && (
                  <a
                    href={selectedBooth.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                    Kunjungi Website Resmi
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
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
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
                  onClick={handleProceedToPayment}
                  className="btn btn-primary w-full btn-lg"
                  id="cart-checkout"
                >
                  Lanjut ke Pembayaran →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== AUTH GATE MODAL ========== */}
      {showAuthGate && (
        <div className="modal-overlay" onClick={() => setShowAuthGate(false)} id="auth-gate-modal">
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                <h2 className="font-bold text-lg">Login untuk Pembayaran</h2>
              </div>
              <button onClick={() => setShowAuthGate(false)} className="btn btn-ghost btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground leading-relaxed mb-5">
              💡 <strong>Ketentuan Sistem:</strong> Pengunjung dapat melihat denah & informasi event secara bebas tanpa login. Namun untuk memproses transaksi pembayaran pesanan, silakan masuk ke akun atau gunakan Akses Tamu 1-Klik di bawah ini.
            </div>

            <form onSubmit={handleGuestQuickLogin} className="space-y-4 mb-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Nama Pengunjung / Tamu</label>
                <input
                  type="text"
                  className="input-base text-sm"
                  placeholder="Misal: Budi Santoso"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  className="input-base text-sm"
                  placeholder="Misal: 081234567890"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full btn-lg" id="guest-quick-login-btn">
                ⚡ Lanjut sebagai Tamu (Guest Login 1-Klik)
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">atau punya akun terdaftar</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={() => router.push("/auth/login")}
              className="btn btn-secondary w-full text-sm"
              id="goto-login-btn"
            >
              🔑 Masuk dengan Akun Boothify
            </button>
          </div>
        </div>
      )}

      {/* ========== CHECKOUT MODAL ========== */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => !paymentSuccess && setShowCheckout(false)} id="checkout-modal">
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">💳 Pembayaran Pesanan Digital</h2>
              {!paymentSuccess && (
                <button onClick={() => setShowCheckout(false)} className="btn btn-ghost btn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>

            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-3xl">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground">🎉 Pembayaran Berhasil!</h3>
                  <p className="text-xs text-muted-foreground mt-1">Pesanan Anda telah diterima oleh merchant</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-border text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor Antrean / Booking:</span>
                    <span className="font-bold font-mono text-primary-light">{orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama Pembeli:</span>
                    <span className="font-medium text-foreground">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode Pembayaran:</span>
                    <span className="font-medium text-foreground">{selectedPaymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bayar:</span>
                    <span className="font-bold text-foreground">Rp {totalCart.toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  💡 Tunjukkan kode <strong>{orderCode}</strong> di meja booth saat mengambil hidangan.
                </p>
                <button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setShowCheckout(false);
                    setCart([]);
                  }}
                  className="btn btn-primary w-full"
                  id="finish-order-btn"
                >
                  Selesai & Kembali ke Denah
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User info */}
                {user && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between text-xs">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Akun Pemesan:</p>
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-muted-foreground">{user.phone || user.email}</p>
                    </div>
                    <span className="badge badge-primary text-[10px] capitalize">{user.role}</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">Total Tagihan</p>
                  <p className="text-3xl font-bold gradient-text mt-1">Rp {totalCart.toLocaleString("id-ID")}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-xs mb-2">Pilih Metode Pembayaran</h3>
                  <div className="space-y-2">
                    {["QRIS", "GoPay", "OVO", "ShopeePay", "Transfer Bank (BCA)", "Kartu Kredit/Debit"].map((method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                          selectedPaymentMethod === method
                            ? "border-primary bg-primary/10"
                            : "border-border bg-white/3 hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={selectedPaymentMethod === method}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="accent-[var(--primary)]"
                        />
                        <span className="text-sm font-medium">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setPaymentSuccess(true)}
                  className="btn btn-primary w-full btn-lg mt-4"
                  id="confirm-payment"
                >
                  Bayar Sekarang Rp {totalCart.toLocaleString("id-ID")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== NON-F&B MINI WEBSITE MODAL ========== */}
      {showMiniWebsite && activeMiniWebsite && (
        <div className="modal-overlay" onClick={() => setShowMiniWebsite(false)} id="mini-website-modal">
          <div className="modal-content max-w-lg p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header banner */}
            <div
              className="h-32 relative flex items-center justify-center p-4 text-center"
              style={{
                background: `linear-gradient(135deg, ${activeMiniWebsite.primaryColor}55, #0f172a)`,
              }}
            >
              <button
                onClick={() => setShowMiniWebsite(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
              >
                ✕
              </button>
              <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                {activeMiniWebsite.headline.slice(0, 2)}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className="badge badge-secondary text-[10px] mb-1">BRAND MINI WEBSITE</span>
                <h3 className="font-bold text-xl text-foreground">{activeMiniWebsite.headline}</h3>
                <p className="text-sm font-medium mt-1" style={{ color: activeMiniWebsite.primaryColor }}>
                  {activeMiniWebsite.tagline}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-border">
                <h4 className="text-xs font-semibold text-foreground mb-2">Tentang Brand & Visi</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeMiniWebsite.aboutText}
                </p>
              </div>

              {activeMiniWebsite.highlights && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">Keunggulan Utama</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeMiniWebsite.highlights.map((h) => (
                      <span key={h} className="badge badge-accent text-[11px] py-1">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`https://instagram.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5"
                >
                  📸 {activeMiniWebsite.instagram}
                </a>
                <a
                  href={activeMiniWebsite.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm flex items-center justify-center gap-1.5"
                >
                  🌐 Kunjungi Web
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventGuidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat petunjuk event...</div>}>
      <EventGuideContent />
    </Suspense>
  );
}
