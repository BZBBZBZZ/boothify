"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/AuthContext";
import {
  ensureEventFloorPlanInitialized,
  DEFAULT_EVENTS_META,
  FloorPlanBooth,
  EventTenantInfo,
  EventDetail,
} from "../../../lib/event-defaults";

interface CartItem {
  boothId: string;
  name: string;
  price: number;
  qty: number;
}

const getZoneBadgeColor = (zone: string) => {
  const z = zone.toLowerCase();
  if (z.includes("fnb") || z.includes("food") || z.includes("makanan")) return "bg-amber-500/15 border-amber-500/40 text-amber-400";
  if (z.includes("fash") || z.includes("busana")) return "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
  if (z.includes("craft") || z.includes("kriya")) return "bg-rose-500/15 border-rose-500/40 text-rose-400";
  if (z.includes("edu") || z.includes("tech")) return "bg-purple-500/15 border-purple-500/40 text-purple-400";
  if (z.includes("auto")) return "bg-blue-500/15 border-blue-500/40 text-blue-400";
  return "bg-cyan-500/15 border-cyan-500/40 text-cyan-400";
};

const getZoneDisplay = (zone: string) => {
  const z = zone.toLowerCase();
  if (z.includes("fnb")) return "F&B";
  if (z.includes("fash")) return "Fashion";
  if (z.includes("craft")) return "Craft";
  if (z.includes("edu")) return "Education";
  if (z.includes("auto")) return "Automotive";
  return zone;
};

function EventGuideContent() {
  const router = useRouter();
  const params = useParams();
  const eventId = (params?.eventId as string) || "1";
  const { user, loginAsGuest } = useAuth();

  const [eventInfo, setEventInfo] = useState<EventDetail>(
    DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"]
  );
  const [booths, setBooths] = useState<FloorPlanBooth[]>([]);
  const [tenantsMap, setTenantsMap] = useState<Record<string, EventTenantInfo>>({});
  const [selectedBooth, setSelectedBooth] = useState<EventTenantInfo | null>(null);
  const [emptyBoothSelected, setEmptyBoothSelected] = useState<FloorPlanBooth | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showMiniWebsite, setShowMiniWebsite] = useState(false);
  const [activeMiniWebsite, setActiveMiniWebsite] = useState<
    | (EventTenantInfo["branding"] & {
        menu?: Array<{ name: string; price: number; image?: string; description?: string }>;
        boothId?: string;
      })
    | null
  >(null);

  const [orderCode, setOrderCode] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("QRIS");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [searchTenant, setSearchTenant] = useState("");

  const [activeOrder, setActiveOrder] = useState<{
    id: string;
    status?: string;
    items?: { name: string; qty: number }[];
    total?: number;
  } | null>(null);

  useEffect(() => {
    try {
      // 1. Load Event Info
      const storedEvents = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const found = storedEvents.find((e: { id: string }) => e.id === eventId);
      const fallbackMeta = DEFAULT_EVENTS_META[eventId] || DEFAULT_EVENTS_META["1"];

      if (found) {
        setEventInfo({
          ...fallbackMeta,
          ...found,
        });
      } else {
        setEventInfo(fallbackMeta);
      }

      // 2. Initialize floor plan booths & tenants for this event
      const initialized = ensureEventFloorPlanInitialized(eventId);
      setBooths(initialized.booths);

      // Hydrate tenants with scoped catalog if available in localStorage
      const updatedTenants = { ...initialized.tenants };

      // 1. Merge any booked booths from boothify_tenant_bookings
      try {
        const storedBookings = JSON.parse(localStorage.getItem("boothify_tenant_bookings") || "[]");
        if (Array.isArray(storedBookings)) {
          storedBookings.forEach((b: { eventId?: string; booth?: string; tenantEmail?: string; tenantName?: string }) => {
            if (b.eventId === eventId && b.booth) {
              const bEmail = b.tenantEmail || "";
              if (!updatedTenants[b.booth]) {
                updatedTenants[b.booth] = {
                  id: b.booth,
                  name: b.tenantName || "Tenant Mitra",
                  category: "Mitra Pameran",
                  zone: b.booth.charAt(0),
                  type: "non-fnb",
                  desc: `${b.tenantName || "Tenant"} terdaftar resmi di event ini.`,
                  tenantEmail: bEmail,
                };
              } else if (bEmail && !updatedTenants[b.booth].tenantEmail) {
                updatedTenants[b.booth].tenantEmail = bEmail;
              }
            }
          });
        }
      } catch {
        // ignore
      }

      // 2. Hydrate each tenant's catalog menu & branding from localStorage
      Object.keys(updatedTenants).forEach((bId) => {
        const tenant = updatedTenants[bId];
        const email = tenant.tenantEmail;
        let scopedMenu: Array<{ name: string; price: number; image?: string; description?: string }> = [];

        if (email) {
          scopedMenu = JSON.parse(localStorage.getItem(`boothify_catalog_menu_${email}`) || "[]");
        }

        // Fallbacks for demo accounts or brand names
        if (!scopedMenu || scopedMenu.length === 0) {
          if (tenant.name?.toLowerCase().includes("ecowear") || email === "demo-tenant@boothify.id" || email === "tenant@boothify.id") {
            scopedMenu = JSON.parse(
              localStorage.getItem("boothify_catalog_menu_demo-tenant@boothify.id") ||
              localStorage.getItem("boothify_catalog_menu_tenant@boothify.id") ||
              localStorage.getItem("boothify_catalog_menu") ||
              "[]"
            );
          } else if (tenant.name?.toLowerCase().includes("kopi") || email === "kopi@boothify.id") {
            scopedMenu = JSON.parse(
              localStorage.getItem("boothify_catalog_menu_kopi@boothify.id") ||
              "[]"
            );
          }
        }

        if (scopedMenu && scopedMenu.length > 0) {
          tenant.menu = scopedMenu;
        }

        // Hydrate website branding
        let scopedWeb = null;
        if (email) {
          scopedWeb = JSON.parse(localStorage.getItem(`boothify_catalog_website_${email}`) || "null");
        }
        if (!scopedWeb && (tenant.name?.toLowerCase().includes("ecowear") || email === "demo-tenant@boothify.id")) {
          scopedWeb = JSON.parse(
            localStorage.getItem("boothify_catalog_website_demo-tenant@boothify.id") ||
            localStorage.getItem("boothify_catalog_website") ||
            "null"
          );
        }
        if (scopedWeb) {
          tenant.branding = {
            headline: scopedWeb.headline || tenant.name,
            tagline: scopedWeb.tagline || "Brand Pilihan",
            aboutText: scopedWeb.aboutText || tenant.desc,
            primaryColor: scopedWeb.primaryColor || "#10b981",
            instagram: scopedWeb.socialLinks?.instagram || "@brand",
            website: scopedWeb.socialLinks?.website || "https://boothify.id",
            highlights: ["Katalog Resmi", "Verified Tenant", "Garansi Kualitas"],
          };
        }
      });

      setTenantsMap(updatedTenants);
    } catch {
      // ignore
    }
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
        return prev.map((i) => (i.boothId === boothId && i.name === name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { boothId, name, price, qty: 1 }];
    });
    setCartToast(`${name} berhasil ditambahkan ke keranjang`);
    window.setTimeout(() => setCartToast(null), 3500);
  };

  const removeFromCart = (boothId: string, name: string) => {
    setCart((prev) => prev.filter((i) => !(i.boothId === boothId && i.name === name)));
  };

  const updateQty = (boothId: string, name: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.boothId === boothId && i.name === name) {
            const newQty = i.qty + delta;
            return newQty <= 0 ? i : { ...i, qty: newQty };
          }
          return i;
        })
        .filter((i) => i.qty > 0)
    );
  };

  const totalCart = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Handle Order Placement directly upon checkout confirmation
  const handleConfirmPayment = () => {
    if (cart.length === 0) return;

    const generatedCode = "BF-ORDER-" + Math.floor(1000 + Math.random() * 9000);
    setOrderCode(generatedCode);

    // 1. Snapshot cart items & total BEFORE clearing cart
    const purchasedItems = cart.map((i) => ({ ...i }));
    const rawTotal = purchasedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const purchasedTotal = rawTotal > 0 ? rawTotal : 185000;

    // 2. Identify target booth & tenant
    const firstBoothId = purchasedItems[0]?.boothId || "A1";
    const targetTenant = tenantsMap[firstBoothId];
    let targetTenantEmail = targetTenant?.tenantEmail || "";

    if (!targetTenantEmail) {
      if (firstBoothId === "A1" || firstBoothId === "A2" || firstBoothId === "C3") {
        targetTenantEmail = "demo-tenant@boothify.id";
      } else if (firstBoothId === "C1" || firstBoothId === "B1" || firstBoothId === "F2") {
        targetTenantEmail = "kopi@boothify.id";
      } else {
        try {
          const tBookings = JSON.parse(localStorage.getItem("boothify_tenant_bookings") || "[]");
          const foundB = tBookings.find(
            (b: { eventId?: string; booth?: string; tenantEmail?: string }) =>
              String(b.eventId) === String(eventId) && b.booth === firstBoothId
          );
          if (foundB?.tenantEmail) targetTenantEmail = foundB.tenantEmail;
        } catch {
          // ignore
        }
      }
    }

    const currentEventTitle =
      eventInfo?.title && eventInfo.title.length > 2
        ? eventInfo.title
        : DEFAULT_EVENTS_META[eventId]?.title || "Green Fashion Expo 2026";

    const newOrder = {
      id: generatedCode,
      eventId: String(eventId),
      event: currentEventTitle,
      booth: firstBoothId,
      items: purchasedItems,
      total: purchasedTotal,
      customer: user?.name || guestName || "Andi Pengunjung",
      phone: user?.phone || guestPhone || "+62 811 2233 4455",
      method: selectedPaymentMethod,
      time: "Baru saja",
      status: "pending" as const,
      tenantEmail: targetTenantEmail,
      tenantName: targetTenant?.name || (firstBoothId === "A1" ? "EcoWear Studio" : `Booth ${firstBoothId}`),
    };

    try {
      const orders = JSON.parse(localStorage.getItem("boothify_visitor_orders") || "[]");
      const cleanedOrders = Array.isArray(orders) ? orders : [];
      cleanedOrders.unshift(newOrder);
      localStorage.setItem("boothify_visitor_orders", JSON.stringify(cleanedOrders));
      localStorage.setItem("boothify_my_order_code", generatedCode);
      setActiveOrder(newOrder);
    } catch {
      // ignore
    }

    // 3. Clear cart and close modal
    setCart([]);
    setShowCheckout(false);
  };

  // Live polling for order status
  useEffect(() => {
    const targetCode = orderCode || (typeof window !== "undefined" ? localStorage.getItem("boothify_my_order_code") : "");
    if (!targetCode) return;

    const checkOrder = () => {
      try {
        const stored = localStorage.getItem("boothify_visitor_orders");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            const found = list.find((o: { id: string }) => o.id === targetCode);
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

  // Filtered tenants for directory
  const allTenantsList = Object.values(tenantsMap);
  const filteredTenants = allTenantsList.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTenant.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchTenant.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTenant.toLowerCase());
    const matchesCat =
      categoryFilter === "Semua" ||
      t.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      (categoryFilter === "F&B" && t.type === "fnb");
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
              id="btn-back-to-event"
            >
              ←
            </button>
            <div>
              <h1 className="font-bold text-sm leading-tight truncate max-w-[200px] sm:max-w-xs">
                {eventInfo.title}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                📱 Panduan Interaktif Pengunjung
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="btn btn-primary btn-sm text-xs relative"
                id="floating-cart-btn"
              >
                🛒 Keranjang ({cart.reduce((s, i) => s + i.qty, 0)})
              </button>
            )}
            <Link
              href="/auth/login"
              className="btn btn-ghost btn-sm text-xs"
            >
              {user ? `👤 ${user.name.split(" ")[0]}` : "Masuk"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5">
        {/* Live Order Tracker Banner */}
        {activeOrder && (
          <div
            className={`p-4 rounded-2xl mb-6 border transition-all animate-fade-in ${
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
                ? "Pesanan Anda sedang dipersiapkan di booth tenant. Mohon bersabar."
                : "Merchant telah menerima pesanan Anda dan akan segera memprosesnya."}
            </p>
          </div>
        )}

        {/* Event Quick Info Banner */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{eventInfo.image || "🎪"}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm text-foreground truncate">{eventInfo.title}</h2>
              <p className="text-xs text-muted-foreground">{eventInfo.date} • {eventInfo.location}</p>
            </div>
            <span className="badge badge-primary text-xs">{eventInfo.category}</span>
          </div>
        </div>

        {/* ========== DENAH ACARA INTERAKTIF ========== */}
        <div className="card-base p-4 sm:p-5 mb-6" id="denah-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" /><line x1="9" y1="21" x2="9" /></svg>
                Denah Booth Acara (Tap Booth untuk Info)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Denah ini disinkronkan langsung dari desain Floor Plan Builder Organizer.
              </p>
            </div>
          </div>

          {/* Filter Zona/Kategori */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 text-xs">
            {["Semua", "F&B", "Fashion", "Craft", "Education"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition ${
                  categoryFilter === cat
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stage */}
          <div className="text-center mb-6">
            <div className="inline-block px-12 py-2 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border border-primary/30 text-xs font-bold text-foreground">
              PANGGUNG UTAMA
            </div>
          </div>

          {/* Organizer-authored floor plan */}
<div className="overflow-auto rounded-2xl mb-4 w-full" id="guide-floor-plan-scroll-area">
  {/* 
    PERUBAHAN: 
    1. min-w-[800px] memperbesar ukuran dasar map sehingga kotak-kotak otomatis lebih besar.
    2. w-full dan aspect-[600/460] membuat map responsif menyesuaikan lebar layar desktop, 
       dan bisa di-scroll (pan) dengan nyaman di mobile.
  */}
  <div className="floor-plan-canvas relative w-full min-w-[800px] aspect-[600/460]">
  {booths.map((b) => {
    const tenant = tenantsMap[b.label];
    const isOccupied = !!tenant;
    const zoneColor = getZoneBadgeColor(b.zone);
    const matchesFilter =
      categoryFilter === "Semua" ||
      b.zone.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      (tenant && tenant.category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return (
      <button
        key={b.id || b.label}
        type="button"
        onClick={() => {
          if (isOccupied) {
            setSelectedBooth(tenant);
          } else {
            setEmptyBoothSelected(b);
          }
        }}
        // PERUBAHAN: Tambah `flex flex-col overflow-hidden p-1.5` (padding sedikit dikurangi agar text punya lebih banyak ruang)
        className={`public-floor-plan-booth absolute p-1.5 sm:p-2 flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
          matchesFilter ? "opacity-100 scale-100" : "opacity-40"
        } ${
          isOccupied
            ? tenant.type === "fnb"
              ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500 hover:scale-[1.02]"
              : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 hover:scale-[1.02]"
            : "bg-white/[0.02] border-white/5 hover:border-white/20"
        }`}
        style={{
          left: `${(b.x / 600) * 100}%`,
          top: `${(b.y / 460) * 100}%`,
          width: `${(b.width / 600) * 100}%`,
          height: `${(b.height / 460) * 100}%`,
          transform: `rotate(${b.rotation || 0}deg)`,
        }}
        id={`guide-booth-${b.label}`}
      >
        <div className="public-floor-plan-booth-header flex items-center justify-between gap-1 mb-0.5 w-full min-w-0">
          <span className="public-floor-plan-booth-label font-bold text-xs sm:text-sm text-foreground truncate">
            {b.label}
          </span>
          <span className={`public-floor-plan-booth-zone badge text-[8px] sm:text-[9px] border truncate flex-shrink-0 max-w-[50%] ${zoneColor}`}>
            {getZoneDisplay(b.zone)}
          </span>
        </div>
        
        {/* PERUBAHAN: Teks dipendekkan & ditambah truncate w-full */}
        <p className="public-floor-plan-booth-size text-[9px] sm:text-[10px] text-muted-foreground truncate w-full">
          Ukuran: {b.sizeCm || "-"}
        </p>

        {/* PERUBAHAN: mt-auto menekan status ke bawah kotak, w-full dan truncate menjaga text */}
        {isOccupied ? (
          <div className="public-floor-plan-booth-status mt-auto w-full pt-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate w-full">{tenant.name}</p>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate w-full">
              {tenant.type === "fnb" ? "🍜 Menu" : "📁 Info"}
            </p>
          </div>
        ) : (
          <div className="public-floor-plan-booth-status mt-auto w-full pt-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate w-full">Kosong</p>
            <p className="text-[8px] sm:text-[10px] text-primary-light truncate w-full">Tersedia</p>
          </div>
        )}
      </button>
    );
  })}
  </div>
</div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
              <span>F&amp;B (Bisa Pesan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
              <span>Fashion / Info</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/10" />
              <span>Booth Kosong</span>
            </div>
          </div>
        </div>

        {/* ========== DIREKTORI TENANT ========== */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm">
                Direktori Brand &amp; Tenant ({filteredTenants.length} Terdaftar)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Jelajahi seluruh brand resmi yang hadir di acara ini
              </p>
            </div>
            <input
              type="text"
              placeholder="Cari tenant / menu..."
              value={searchTenant}
              onChange={(e) => setSearchTenant(e.target.value)}
              className="input-base text-xs py-1.5 sm:max-w-xs"
            />
          </div>

          {filteredTenants.length === 0 ? (
            <div className="text-center py-8 card-base border border-dashed border-border rounded-xl">
              <p className="text-xs text-muted-foreground">Tidak ada tenant yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedBooth(t)}
                  className="w-full card-interactive p-3.5 text-left flex items-center gap-3"
                  id={`tenant-dir-${t.id}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      t.type === "fnb" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {t.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{t.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
                  </div>
                  <span className={`badge text-[10px] shrink-0 ${t.type === "fnb" ? "badge-accent" : "badge-secondary"}`}>
                    {t.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ========== MODAL BOOTH OCCUPIED DETAIL ========== */}
      {selectedBooth && (
        <div className="modal-overlay" onClick={() => setSelectedBooth(null)} id="booth-detail-modal">
          <div className="modal-content max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedBooth.type === "fnb" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {selectedBooth.id}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedBooth.name}</h2>
                  <p className="text-xs text-muted-foreground">Booth {selectedBooth.id} • {selectedBooth.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBooth(null)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{selectedBooth.desc}</p>

            {cartToast && (
              <button type="button" onClick={() => { setCartToast(null); setShowCart(true); }} className="w-full text-left p-3 rounded-xl mb-5 bg-primary/10 border border-primary/30 text-sm animate-fade-in" id="cart-toast">
                <span className="font-semibold text-primary-light">✓ Produk berhasil ditambahkan ke keranjang.</span>
                <span className="block text-xs text-muted-foreground mt-1">Ketuk untuk melihat keranjang Anda →</span>
              </button>
            )}

            {/* Products & Menu Catalog for ANY tenant with products */}
            {selectedBooth.menu && selectedBooth.menu.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <span>{selectedBooth.type === "fnb" ? "📋 Menu Sajian — Pesan Langsung" : "🛍️ Katalog Produk & Merchandise — Pesan Langsung"}</span>
                  </h3>
                  <span className="badge badge-primary text-[10px]">{selectedBooth.menu.length} Item</span>
                </div>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedBooth.menu.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                      <span className="text-2xl">{item.image || (selectedBooth.type === "fnb" ? "☕" : "🛍️")}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                        {item.description && <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>}
                        <p className="text-xs text-primary-light font-semibold">
                          Rp {item.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(selectedBooth.id, item.name, item.price)}
                        className="btn btn-primary btn-sm text-xs px-3"
                        id={`add-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        + Pesan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Website & Media Showcase */}
            {selectedBooth.branding && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-primary text-[10px]">MINI WEBSITE RESMI</span>
                  <span className="text-[11px] text-primary-light font-medium">Verified Tenant</span>
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{selectedBooth.branding.headline}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{selectedBooth.branding.aboutText}</p>
                <button
                  onClick={() => {
                    if (selectedBooth.branding) {
                      setActiveMiniWebsite({
                        headline: selectedBooth.branding.headline,
                        tagline: selectedBooth.branding.tagline,
                        aboutText: selectedBooth.branding.aboutText,
                        primaryColor: selectedBooth.branding.primaryColor,
                        instagram: selectedBooth.branding.instagram,
                        website: selectedBooth.branding.website,
                        highlights: selectedBooth.branding.highlights,
                        menu: selectedBooth.menu,
                        boothId: selectedBooth.id,
                      });
                      setShowMiniWebsite(true);
                    }
                  }}
                  className="btn btn-primary btn-sm w-full text-xs"
                  id="open-mini-website-btn"
                >
                  🌐 Kunjungi Mini Website Brand
                </button>
              </div>
            )}

            {selectedBooth.media && selectedBooth.media.length > 0 && (
              <div className="mb-2">
                <h3 className="font-semibold text-xs mb-2">📁 Brosur &amp; Media Digital</h3>
                <div className="space-y-2">
                  {selectedBooth.media.map((med) => (
                    <div key={med} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <span className="truncate">{med}</span>
                      <span className="text-primary-light font-medium cursor-pointer">Lihat ↗</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL BOOTH EMPTY INFO ========== */}
      {emptyBoothSelected && (
        <div className="modal-overlay" onClick={() => setEmptyBoothSelected(null)}>
          <div className="modal-content max-w-sm text-center py-6" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl block mb-2">🏪</span>
            <h3 className="font-bold text-base mb-1">Booth {emptyBoothSelected.label} Masih Kosong</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Zona {getZoneDisplay(emptyBoothSelected.zone)} • Biaya Sewa Rp {(emptyBoothSelected.price || 2500000).toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              Apakah Anda pelaku usaha / brand yang berminat menyewa booth ini?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/events/${eventId}`)}
                className="btn btn-primary btn-sm"
              >
                Sewa Booth Ini Sekarang
              </button>
              <button onClick={() => setEmptyBoothSelected(null)} className="btn btn-ghost btn-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MINI WEBSITE FULLSCREEN MODAL ========== */}
      {showMiniWebsite && activeMiniWebsite && (
        <div className="modal-overlay" onClick={() => setShowMiniWebsite(false)} id="mini-website-modal">
          <div
            className="modal-content max-w-lg p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--card)" }}
          >
            <div
              className="h-32 flex items-center justify-center relative"
              style={{
                background: `linear-gradient(135deg, ${activeMiniWebsite.primaryColor}50, ${activeMiniWebsite.primaryColor}15)`,
              }}
            >
              <button
                onClick={() => setShowMiniWebsite(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-xl"
                style={{
                  backgroundColor: `${activeMiniWebsite.primaryColor}40`,
                  color: activeMiniWebsite.primaryColor,
                }}
              >
                {activeMiniWebsite.headline.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="p-6 text-center">
              <h2 className="font-bold text-xl mb-1">{activeMiniWebsite.headline}</h2>
              <p className="text-sm font-medium mb-3" style={{ color: activeMiniWebsite.primaryColor }}>
                {activeMiniWebsite.tagline}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {activeMiniWebsite.aboutText}
              </p>

              {activeMiniWebsite.highlights && (
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                  {activeMiniWebsite.highlights.map((h) => (
                    <div key={h} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 font-medium">
                      ✓ {h}
                    </div>
                  ))}
                </div>
              )}

              {/* Products Catalog Inside Mini Website */}
              {activeMiniWebsite.menu && activeMiniWebsite.menu.length > 0 && (
                <div className="mb-6 text-left">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
                    🛍️ Produk &amp; Layanan Resmi
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeMiniWebsite.menu.map((prod) => (
                      <div
                        key={prod.name}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{prod.image || "🛍️"}</span>
                          <div>
                            <div className="font-semibold text-foreground">{prod.name}</div>
                            <div className="text-[11px] font-bold" style={{ color: activeMiniWebsite.primaryColor }}>
                              Rp {prod.price.toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (activeMiniWebsite.boothId) {
                              addToCart(activeMiniWebsite.boothId, prod.name, prod.price);
                              setShowMiniWebsite(false);
                              setShowCart(true);
                            }
                          }}
                          className="btn btn-primary btn-sm text-[11px] py-1 px-3 h-auto"
                        >
                          + Beli
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>📸 {activeMiniWebsite.instagram}</span>
                <span>🌐 {activeMiniWebsite.website}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CART DRAWER ========== */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">🛒 Keranjang Pesanan</h3>
              <button onClick={() => setShowCart(false)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>

            {cartToast && (
              <div className="p-3 rounded-xl mb-4 bg-primary/10 border border-primary/30 text-sm animate-fade-in" id="cart-toast-drawer">
                <p className="font-semibold text-primary-light">✓ Produk berhasil ditambahkan ke keranjang.</p>
                <p className="text-xs text-muted-foreground mt-1">Pesanan Anda sudah tercatat di keranjang ini.</p>
              </div>
            )}

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={`${item.boothId}-${item.name}`} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Booth {item.boothId} • Rp {item.price.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.boothId, item.name, -1)} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs">
                      -
                    </button>
                    <span className="font-bold text-xs w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.boothId, item.name, 1)} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs">
                      +
                    </button>
                    <button onClick={() => removeFromCart(item.boothId, item.name)} className="text-xs text-error ml-2">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between font-bold text-base mb-4 pt-3 border-t border-border">
              <span>Total Tagihan:</span>
              <span className="gradient-text">Rp {totalCart.toLocaleString("id-ID")}</span>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="btn btn-primary w-full"
              id="checkout-cart-btn"
            >
              Lanjut Pembayaran →
            </button>
          </div>
        </div>
      )}

      {/* ========== AUTH GATE (LOGIN / GUEST INFO) ========== */}
      {showAuthGate && (
        <div className="modal-overlay" onClick={() => setShowAuthGate(false)}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base mb-2">Identitas Pemesan</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Isi nama &amp; WhatsApp Anda agar tenant dapat memberi tahu saat pesanan Anda siap diambil.
            </p>

            <form onSubmit={handleGuestQuickLogin} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Andi Pengunjung"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input-base text-xs w-full py-2"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold block mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="0812-xxxx-xxxx"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="input-base text-xs w-full py-2"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full btn-sm mt-3">
                Lanjut ke Bayar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========== PAYMENT MODAL ========== */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal-content max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-2">📱</div>
            <h3 className="font-bold text-base mb-1">Pembayaran Pesanan</h3>
            <p className="text-xs text-muted-foreground mb-4">Total: Rp {totalCart.toLocaleString("id-ID")}</p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-4 text-xs space-y-3 text-left">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["QRIS", "GoPay", "ShopeePay", "Tunai"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m)}
                      className={`p-2 rounded-lg text-center font-medium border text-xs transition ${
                        selectedPaymentMethod === m
                          ? "bg-primary/20 border-primary text-primary-light"
                          : "bg-white/[0.02] border-white/5 text-muted-foreground hover:bg-white/[0.05]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-muted-foreground">Nama Pemesan</span>
                <span className="font-semibold">{user?.name || guestName || "Pengunjung"}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="btn btn-primary w-full btn-sm mb-2"
              id="confirm-pay-btn"
            >
              Simulasikan Bayar Sukses ✓
            </button>
            <button onClick={() => setShowCheckout(false)} className="btn btn-ghost btn-sm w-full text-xs">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventGuidePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat panduan event...</div>}>
      <EventGuideContent />
    </Suspense>
  );
}
