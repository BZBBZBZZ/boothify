"use client";

<<<<<<< Updated upstream
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/AuthContext";

type CatalogType = "fnb" | "non-fnb";

type MenuItem = { id: string; name: string; price: number; description: string; stock: number; image: string };
type MediaItem = { id: string; name: string; type: string; description: string };

const DEMO_FNB_MENU: MenuItem[] = [
  { id: "m1", name: "Kopi Susu Gula Aren", price: 22000, description: "Espresso blend robusta-arabika nusantara dengan gula aren murni & fresh milk", stock: 100, image: "☕" },
  { id: "m2", name: "Matcha Oat Latte", price: 28000, description: "Matcha ceremonial Jepang berpadu creamy oat milk", stock: 60, image: "🍵" },
  { id: "m3", name: "Butter Croissant", price: 18000, description: "Flaky french butter croissant renyah dipanggang fresh tiap pagi", stock: 45, image: "🥐" },
  { id: "m4", name: "V60 Single Origin (Gayo)", price: 30000, description: "Manual brew filter coffee biji Aceh Gayo notes fruity floral", stock: 35, image: "☕" },
];

const DEMO_FNB_MEDIA: MediaItem[] = [
  { id: "fnb-med1", name: "Daftar Menu & Sertifikasi Halal.pdf", type: "PDF", description: "Brosur daftar harga lengkap dan uji sertifikasi bahan" },
  { id: "fnb-med2", name: "Galeri Setup Barista Kopi", type: "Galeri", description: "Dokumentasi booth espresso machine portabel di event" },
];

const DEMO_FASHION_MENU: MenuItem[] = [
  { id: "f1", name: "Organic Cotton T-Shirt", price: 185000, description: "Kaos berbahan 100% serat katun organik tanpa pestisida", stock: 30, image: "👕" },
  { id: "f2", name: "Linen Outerwear Bandung", price: 320000, description: "Outer santai bahan linen natural hasil tenun perajin lokal", stock: 20, image: "🧥" },
  { id: "f3", name: "Upcycled Denim Totebag", price: 95000, description: "Tas jinjing daur ulang perca denim berkualitas tinggi", stock: 50, image: "👜" },
];

const DEMO_FASHION_MEDIA: MediaItem[] = [
  { id: "fash-med1", name: "EcoWear Lookbook 2026.pdf", type: "PDF", description: "Katalog busana sirkular berkelanjutan musim 2026" },
  { id: "fash-med2", name: "Galeri Pewarna Alami & Tenun", type: "Galeri", description: "Proses produksi etis bersama pengrajin tenun Jawa Barat" },
  { id: "fash-med3", name: "Video Zero-Waste Production", type: "Video", description: "Video 2 menit proses produksi ramah lingkungan" },
];

export default function CatalogPage() {
  const { user } = useAuth();
  const email = user?.email || "demo-tenant@boothify.id";
  const isKopi = email === "kopi@boothify.id";
  const isEcoWear = email === "demo-tenant@boothify.id" || email === "tenant@boothify.id";

  const [catalogType, setCatalogType] = useState<CatalogType>(isKopi ? "fnb" : "non-fnb");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [websiteConfig, setWebsiteConfig] = useState({
    headline: user?.businessName || user?.name || "Brand Saya",
    tagline: "Fashion yang merawat bumi 🌿",
    aboutText: "Kami adalah brand resmi yang berpartisipasi dalam pameran ini.",
    primaryColor: "#10b981",
    socialLinks: {
      instagram: user?.instagram || "@brand",
      website: user?.website || "https://boothify.id",
      whatsapp: user?.phone || "+6281234567890",
    },
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenu, setNewMenu] = useState({ name: "", price: 0, description: "", stock: 50 });
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingMenuData, setEditingMenuData] = useState({ name: "", price: 0, description: "", stock: 50 });

  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState({ name: "", type: "PDF", description: "" });
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  // Load scoped catalog on mount or when user changes
  useEffect(() => {
    try {
      // 1. Catalog type
      const storedType = localStorage.getItem(`boothify_catalog_type_${email}`);
      if (storedType === "fnb" || storedType === "non-fnb") {
        setCatalogType(storedType);
      } else {
        setCatalogType(isKopi ? "fnb" : isEcoWear ? "non-fnb" : user?.businessCategory === "fnb" || user?.category === "fnb" ? "fnb" : "non-fnb");
      }

      // 2. Menu items
      const storedMenu = localStorage.getItem(`boothify_catalog_menu_${email}`);
      if (storedMenu) {
        setMenuItems(JSON.parse(storedMenu));
      } else if (isKopi) {
        setMenuItems(DEMO_FNB_MENU);
      } else if (isEcoWear) {
        setMenuItems(DEMO_FASHION_MENU);
      } else {
        setMenuItems([]);
      }

      // 3. Media items
      const storedMedia = localStorage.getItem(`boothify_catalog_media_${email}`);
      if (storedMedia) {
        setMediaItems(JSON.parse(storedMedia));
      } else if (isKopi) {
        setMediaItems(DEMO_FNB_MEDIA);
      } else if (isEcoWear) {
        setMediaItems(DEMO_FASHION_MEDIA);
      } else {
        setMediaItems([]);
      }

      // 4. Mini website config
      const storedWebsite = localStorage.getItem(`boothify_catalog_website_${email}`);
      if (storedWebsite) {
        setWebsiteConfig(JSON.parse(storedWebsite));
      } else if (isKopi) {
        setWebsiteConfig({
          headline: "Kopi Keliling Nusantara",
          tagline: "Secangkir Cerita di Setiap Sudut Event ☕",
          aboutText: "Spesialisasi kopi keliling lokal bermutu tinggi menyajikan manual brew dan espresso machine portabel untuk memanjakan pengunjung expo.",
          primaryColor: "#d97706",
          socialLinks: { instagram: "@kopikeliling.id", website: "https://kopikeliling.id", whatsapp: "+6281234567890" },
        });
      } else if (isEcoWear) {
        setWebsiteConfig({
          headline: "EcoWear Studio",
          tagline: "Fashion yang merawat bumi 🌿",
          aboutText: "Kami adalah brand fashion sirkular berkelanjutan yang menggunakan 100% serat organik dan daur ulang tekstil dengan etika fair trade.",
          primaryColor: "#10b981",
          socialLinks: { instagram: "@ecowearstudio", website: "https://ecowear.id", whatsapp: "+6281298765432" },
        });
      } else {
        setWebsiteConfig({
          headline: user?.businessName || user?.name || "Brand Saya",
          tagline: "Selamat datang di booth kami!",
          aboutText: user?.description || "Kami menghadirkan produk dan penawaran terbaik untuk pengunjung acara.",
          primaryColor: "#6366f1",
          socialLinks: {
            instagram: user?.instagram || "@brand",
            website: user?.website || "https://boothify.id",
            whatsapp: user?.phone || "",
          },
        });
      }

      setIsLoaded(true);
    } catch {
      setIsLoaded(true);
    }
  }, [user, email, isKopi, isEcoWear]);

  // Persist changes only after initial scoped load is completed
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(`boothify_catalog_menu_${email}`, JSON.stringify(menuItems));
      localStorage.setItem(`boothify_catalog_media_${email}`, JSON.stringify(mediaItems));
      localStorage.setItem(`boothify_catalog_website_${email}`, JSON.stringify(websiteConfig));
      localStorage.setItem(`boothify_catalog_type_${email}`, catalogType);

      // Backwards-compatibility sync for EcoWear default
      if (isEcoWear) {
        localStorage.setItem("boothify_catalog_menu", JSON.stringify(menuItems));
        localStorage.setItem("boothify_catalog_media", JSON.stringify(mediaItems));
        localStorage.setItem("boothify_catalog_website", JSON.stringify(websiteConfig));
      }

      // Synchronize changes directly to all events where this tenant is registered
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("boothify_event_") && key.endsWith("_booth_tenants")) {
          const tenantsRaw = localStorage.getItem(key);
          if (tenantsRaw) {
            const tenants = JSON.parse(tenantsRaw);
            let modified = false;
            Object.keys(tenants).forEach((bLabel) => {
              const t = tenants[bLabel];
              const isMatch =
                (t.tenantEmail && t.tenantEmail.toLowerCase() === email.toLowerCase()) ||
                (isEcoWear && t.name?.toLowerCase().includes("ecowear")) ||
                (isKopi && t.name?.toLowerCase().includes("kopi")) ||
                (user?.businessName && t.name?.toLowerCase() === user.businessName.toLowerCase());

              if (isMatch) {
                t.menu = menuItems;
                t.media = mediaItems.map((m) => m.name);
                t.type = catalogType;
                t.branding = {
                  headline: websiteConfig.headline || t.name,
                  tagline: websiteConfig.tagline,
                  aboutText: websiteConfig.aboutText,
                  primaryColor: websiteConfig.primaryColor,
                  instagram: websiteConfig.socialLinks.instagram,
                  website: websiteConfig.socialLinks.website,
                  highlights: ["Katalog Resmi", "Verified Tenant", "Garansi Kualitas"],
                };
                modified = true;
              }
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(tenants));
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, [menuItems, mediaItems, websiteConfig, catalogType, isLoaded, email, isEcoWear, isKopi, user?.businessName]);

  const addMenuItem = () => {
    if (!newMenu.name) return;
    const item: MenuItem = {
      ...newMenu,
      id: String(Date.now()),
      price: Number(newMenu.price),
      stock: Number(newMenu.stock),
      image: isKopi ? "☕" : "📦",
    };
    setMenuItems((prev) => [...prev, item]);
    setNewMenu({ name: "", price: 0, description: "", stock: 50 });
    setShowAddMenu(false);
    showToast("Menu berhasil ditambahkan!");
  };

  const saveEditMenuItem = () => {
    if (!editingMenuId) return;
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === editingMenuId
          ? {
              ...item,
              name: editingMenuData.name,
              price: Number(editingMenuData.price),
              description: editingMenuData.description,
              stock: Number(editingMenuData.stock),
            }
          : item
      )
    );
    setEditingMenuId(null);
    showToast("Perubahan menu berhasil disimpan!");
  };

  const removeMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    showToast("Menu berhasil dihapus!");
  };

  const addMediaItem = () => {
    if (!newMedia.name) return;
    setMediaItems((prev) => [...prev, { ...newMedia, id: String(Date.now()) }]);
    setNewMedia({ name: "", type: "PDF", description: "" });
    setShowAddMediaModal(false);
    showToast("Media promosi berhasil ditambahkan!");
  };

  const removeMediaItem = (id: string) => {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    showToast("Media berhasil dihapus!");
  };

  const handleSaveWebsite = () => {
    try {
      localStorage.setItem(`boothify_catalog_website_${email}`, JSON.stringify(websiteConfig));
      if (isEcoWear) {
        localStorage.setItem("boothify_catalog_website", JSON.stringify(websiteConfig));
      }
      showToast("✓ Pengaturan Mini Website Berhasil Disimpan!");
    } catch {
      // ignore
    }
  };

  return (
    <div className="animate-fade-in relative" id="catalog-page">
      {/* Toast notification */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium text-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-xs font-bold">✓</div>
          {notificationToast}
=======
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTenantActiveEvent } from "@/app/lib/tenant-active-event";
import { Notice, Tabs, PaymentBadge } from "@/app/components/ui";
import Link from "next/link";
import { useAuth } from "../../../components/AuthContext";

import {
  listTenantBookings,
  listTenantPendingBookings,
  listTenantOrders,
  updateOrderStatus as saveOrderStatus,
  errorMessage,
  type Booking,
  type VisitorOrder as DbVisitorOrder,
  type OrderStatus,
} from "@/app/lib/db";
import Icon from "../../../components/Icon";

type VisitorOrder = DbVisitorOrder & { time: string };
type BookingItem = Booking;

const orderTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export default function TenantBookingsAndOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "booths">("orders");
  // Everything for this tenant; the page shows the part for the event picked in the sidebar
  const [allOrders, setOrders] = useState<VisitorOrder[]>([]);
  const [allBookings, setBookings] = useState<BookingItem[]>([]);
  // Booths held while a payment is still open
  const [allHolds, setHolds] = useState<BookingItem[]>([]);
  const { eventId, event: activeEvent, events, loaded: eventsLoaded, setEventId } = useTenantActiveEvent(user?.role === "tenant" ? user.id : "");

  // /dashboard/tenant/bookings/[eventId] opens with that event picked
  const params = useParams();
  const routeEventId = typeof params?.eventId === "string" ? params.eventId : "";
  useEffect(() => {
    if (routeEventId && eventsLoaded && events.some((e) => e.id === routeEventId)) setEventId(routeEventId);
  }, [routeEventId, eventsLoaded, events, setEventId]);

  const orders = allOrders.filter((o) => o.eventId === eventId);
  const bookings = allBookings.filter((b) => b.eventId === eventId);
  const holds = allHolds.filter((h) => h.eventId === eventId);
  const otherEventHolds = allHolds.filter((h) => h.eventId !== eventId);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [selectedPass, setSelectedPass] = useState<BookingItem | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const tenantId = user?.id || "";
    if (!tenantId || user?.role !== "tenant") return;
    let cancelled = false;

    listTenantBookings(tenantId)
      .then((list) => {
        if (!cancelled) setBookings(list);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Booking gagal dimuat."));
      });

    listTenantPendingBookings(tenantId)
      .then((list) => {
        if (!cancelled) setHolds(list);
      })
      .catch(() => { });

    const loadOrders = () =>
      listTenantOrders(tenantId)
        .then((list) => {
          if (!cancelled) setOrders(list.map((o) => ({ ...o, time: orderTime(o.createdAt) })));
        })
        .catch((err) => {
          if (!cancelled) setLoadError(errorMessage(err, "Pesanan gagal dimuat."));
        });
    loadOrders();
    // The kitchen display refreshes itself so new orders appear on their own
    const interval = window.setInterval(loadOrders, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Roll back to the full list (all events), not just the filtered one
    const previous = allOrders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      await saveOrderStatus(orderId, newStatus);
    } catch (err) {
      setOrders(previous);
      setLoadError(errorMessage(err, "Status pesanan gagal diubah."));
    }
  };

  // The kitchen queue only holds orders the server has confirmed as paid; unpaid ones wait outside it
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const awaitingPaymentCount = orders.filter((o) => o.paymentStatus === "pending").length;
  const filteredOrders = statusFilter === "all" ? paidOrders : paidOrders.filter((o) => (o.status || "pending") === statusFilter);

  const pendingCount = paidOrders.filter((o) => (o.status || "pending") === "pending").length;
  const makingCount = paidOrders.filter((o) => o.status === "making").length;
  const readyCount = paidOrders.filter((o) => o.status === "ready").length;
  const doneCount = paidOrders.filter((o) => o.status === "done").length;

  const holdGroups = Object.values(
    holds.reduce<Record<string, BookingItem[]>>((acc, h) => {
      (acc[h.eventId] ||= []).push(h);
      return acc;
    }, {})
  );

  return (
    <div className="animate-fade-in" id="tenant-orders-and-booths">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header-title mb-1">Pesanan Pengunjung &amp; Kelola Booth</h1>
          <p className="text-muted-foreground text-sm">
            {activeEvent ? (
              <>
                Event: <span className="text-foreground font-semibold">{activeEvent.title}</span>
                {activeEvent.date ? ` (${activeEvent.date})` : ""}. Ganti event lewat &quot;Event dipilih&quot; di menu samping.
              </>
            ) : eventsLoaded ? (
              "Belum ada event. Sewa booth dulu lewat Cari Event."
            ) : (
              "Memuat event..."
            )}
          </p>
>>>>>>> Stashed changes
        </div>
      </div>

      {loadError && <Notice tone="error" className="mb-6">{loadError}</Notice>}

      {otherEventHolds.length > 0 && (
        <Notice tone="info" className="mb-6">
          Ada {otherEventHolds.length} booth di event lain yang masih menunggu pembayaran
          ({Array.from(new Set(otherEventHolds.map((h) => h.event))).join(", ")}). Pilih event itu di menu samping untuk melanjutkan.
        </Notice>
      )}

<<<<<<< Updated upstream
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            showToast(`Foto "${e.target.files[0].name}" berhasil diunggah!`);
          }
        }}
      />
      <input
        type="file"
        ref={mediaFileInputRef}
        className="hidden"
        accept=".pdf,image/*,video/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const isPdf = file.name.endsWith(".pdf");
            const isVideo = file.type.startsWith("video/");
            const type = isPdf ? "PDF" : isVideo ? "Video" : "Galeri";
            setMediaItems((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                name: file.name,
                type,
                description: `Diunggah: ${new Date().toLocaleDateString("id-ID")}`,
              },
            ]);
            showToast(`File "${file.name}" berhasil diunggah!`);
          }
        }}
      />

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold">Katalog Produk &amp; Media</h1>
          <span className="badge badge-primary text-xs">
            🏢 {user?.businessName || user?.name || "Akun Tenant"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola menu produk atau media promosi digital yang akan tampil otomatis saat pengunjung scan booth Anda.
        </p>
      </div>

      {/* ===== F&B CATALOG ===== */}
      {true && (
        <div className="space-y-6">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">Menu Makanan &amp; Minuman</h2>
                <p className="text-xs text-muted-foreground">Produk ini dapat langsung dipesan oleh pengunjung event</p>
              </div>
              <button onClick={() => setShowAddMenu(true)} className="btn btn-primary btn-sm" id="add-menu-btn">
                + Tambah Menu
              </button>
            </div>

            {/* Add menu form */}
            {showAddMenu && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-5 space-y-3 animate-fade-in">
                <h3 className="text-sm font-semibold">Tambah Menu Baru</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Nama menu / minuman"
                    value={newMenu.name}
                    onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                  />
                  <input
                    type="number"
                    className="input-base"
                    placeholder="Harga (Rp)"
                    value={newMenu.price || ""}
                    onChange={(e) => setNewMenu({ ...newMenu, price: Number(e.target.value) })}
                  />
                </div>
                <input
                  type="text"
                  className="input-base"
                  placeholder="Deskripsi singkat (misal: racikan rempah atau varian rasa)"
                  value={newMenu.description}
                  onChange={(e) => setNewMenu({ ...newMenu, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={addMenuItem} className="btn btn-primary btn-sm">
                    Simpan Menu
                  </button>
                  <button onClick={() => setShowAddMenu(false)} className="btn btn-ghost btn-sm">
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Menu list */}
            {menuItems.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <p className="text-4xl mb-2">🍽️</p>
                <p className="font-medium text-sm mb-1">Belum Ada Menu Produk</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Tambahkan menu makanan, minuman, atau produk fisik Anda untuk mulai menerima order.
                </p>
                <button onClick={() => setShowAddMenu(true)} className="btn btn-primary btn-sm">
                  + Buat Menu Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition border border-white/5">
                    {editingMenuId === item.id ? (
                      <div className="space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            className="input-base"
                            value={editingMenuData.name}
                            onChange={(e) => setEditingMenuData({ ...editingMenuData, name: e.target.value })}
                            placeholder="Nama menu"
                          />
                          <input
                            type="number"
                            className="input-base"
                            value={editingMenuData.price}
                            onChange={(e) => setEditingMenuData({ ...editingMenuData, price: Number(e.target.value) })}
                            placeholder="Harga"
                          />
                          <input
                            type="number"
                            className="input-base"
                            value={editingMenuData.stock}
                            onChange={(e) => setEditingMenuData({ ...editingMenuData, stock: Number(e.target.value) })}
                            placeholder="Stok"
                          />
                        </div>
                        <input
                          type="text"
                          className="input-base"
                          value={editingMenuData.description}
                          onChange={(e) => setEditingMenuData({ ...editingMenuData, description: e.target.value })}
                          placeholder="Deskripsi"
                        />
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEditMenuItem} className="btn btn-primary btn-sm">
                            Simpan Perubahan
                          </button>
                          <button onClick={() => setEditingMenuId(null)} className="btn btn-ghost btn-sm">
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{item.image}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-primary-light font-semibold">
                              Rp {item.price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-muted-foreground">Stok: {item.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingMenuId(item.id);
                              setEditingMenuData({
                                name: item.name,
                                price: item.price,
                                description: item.description,
                                stock: item.stock,
                              });
                            }}
                            className="btn btn-ghost btn-sm text-xs"
                          >
                            Edit
                          </button>
                          <button onClick={() => removeMenuItem(item.id)} className="btn btn-ghost btn-sm text-xs text-error">
                            Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Photo upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition cursor-pointer group"
            >
              <svg className="mx-auto mb-2 text-muted-foreground group-hover:text-primary-light transition" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm text-muted-foreground">
                Upload foto menu — drag &amp; drop atau <span className="text-primary-light underline font-medium">klik di sini</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== NON-F&B CATALOG ===== */}
      {true && (
        <div className="space-y-6">
          {/* Media uploads */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">Media Promosi Digital</h2>
                <p className="text-xs text-muted-foreground">Brosur, lookbook, foto galeri, dan video showcase</p>
              </div>
              <button onClick={() => setShowAddMediaModal(true)} className="btn btn-primary btn-sm" id="add-media-btn">
                + Upload Media
              </button>
            </div>

            {mediaItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl">
                <p className="text-4xl mb-2">📁</p>
                <p className="font-medium text-sm mb-1">Belum Ada Media Digital</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Unggah katalog PDF, video promosi, atau galeri portofolio brand Anda.
                </p>
                <button onClick={() => setShowAddMediaModal(true)} className="btn btn-secondary btn-sm">
                  + Upload Dokumen / Video
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mediaItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    {editingMediaId === item.id ? (
                      <div className="space-y-3 animate-fade-in">
                        <input
                          type="text"
                          className="input-base"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMediaItems(mediaItems.map((m) => (m.id === item.id ? { ...m, name: val } : m)));
                          }}
                          placeholder="Nama media"
                        />
                        <input
                          type="text"
                          className="input-base"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMediaItems(mediaItems.map((m) => (m.id === item.id ? { ...m, description: val } : m)));
                          }}
                          placeholder="Deskripsi media"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingMediaId(null)} className="btn btn-primary btn-sm">
                            Selesai
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary-light">
                          {item.type === "PDF" ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          ) : item.type === "Video" ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <span className="badge badge-secondary text-[10px]">{item.type}</span>
                        <button onClick={() => setEditingMediaId(item.id)} className="btn btn-ghost btn-sm text-xs">
                          Edit
                        </button>
                        <button onClick={() => removeMediaItem(item.id)} className="btn btn-ghost btn-sm text-xs text-error">
                          Hapus
                        </button>
=======
      {/* Tabs */}
      <Tabs<"orders" | "booths">
        label="Bagian pesanan dan booth"
        idPrefix="bookings"
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "orders", label: "Pesanan pengunjung", count: paidOrders.length },
          { key: "booths", label: "Booth saya", count: bookings.length },
        ]}
      />

      {/* ========== TAB 1: VISITOR ORDERS MANAGER ========== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-secondary"}`}
            >
              Semua ({paidOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`btn btn-sm ${statusFilter === "pending" ? "btn-primary" : "btn-secondary"}`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("making")}
              className={`btn btn-sm ${statusFilter === "making" ? "btn-primary" : "btn-secondary"}`}
            >
              Sedang Dibuat ({makingCount})
            </button>
            <button
              onClick={() => setStatusFilter("ready")}
              className={`btn btn-sm ${statusFilter === "ready" ? "btn-primary" : "btn-secondary"}`}
            >
              Siap Diambil ({readyCount})
            </button>
            <button
              onClick={() => setStatusFilter("done")}
              className={`btn btn-sm ${statusFilter === "done" ? "btn-primary" : "btn-secondary"}`}
            >
              Selesai ({doneCount})
            </button>
          </div>

          {awaitingPaymentCount > 0 && (
            <Notice tone="info" className="mb-4">
              {awaitingPaymentCount} pesanan menunggu pembayaran dan belum masuk antrean. Pesanan muncul di sini setelah pembayaran dikonfirmasi server.
            </Notice>
          )}

          {filteredOrders.length === 0 ? (
            <div className="card-base p-12 text-center text-muted-foreground">
              <span className="text-4xl block mb-2"><Icon name="utensils" size={32} /></span>
              <p className="font-semibold text-foreground mb-1">Belum ada pesanan pada status ini</p>
              <p className="text-xs">
                Pesanan yang dibuat oleh pengunjung melalui scan QR di booth kamu akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const currentStatus = order.status || "pending";

                return (
                  <div
                    key={order.id}
                    className={`card-base p-5 flex flex-col justify-between transition border ${currentStatus === "making"
                        ? "border-sky-500/40 bg-sky-500/[0.03]"
                        : currentStatus === "ready"
                          ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                          : currentStatus === "done"
                            ? "border-foreground/5 opacity-70"
                            : "border-amber-500/30 bg-amber-500/[0.02]"
                      }`}
                    id={`order-card-${order.id}`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-primary-light">
                            {order.id}
                          </span>
                          <span className="badge badge-secondary text-[10px] font-semibold">
                            Booth {order.booth || order.items[0]?.boothId || "-"}
                          </span>
                          <PaymentBadge status={order.paymentStatus} />
                        </div>
                        {currentStatus === "pending" && (
                          <span className="badge text-[10px] bg-amber-500/15 text-amber-700 border border-amber-500/30">
                            Baru Masuk
                          </span>
                        )}
                        {currentStatus === "making" && (
                          <span className="badge text-[10px] bg-sky-500/15 text-sky-700 border border-sky-500/30 animate-pulse">
                            Sedang Dibuat
                          </span>
                        )}
                        {currentStatus === "ready" && (
                          <span className="badge text-[10px] bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                            Siap Diambil
                          </span>
                        )}
                        {currentStatus === "done" && (
                          <span className="badge text-[10px] bg-foreground/10 text-muted-foreground border border-foreground/10">
                            Selesai
                          </span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="mb-3 pb-3 border-b border-foreground/5 text-xs">
                        <p className="font-semibold text-foreground text-sm">{order.customer}</p>
                        <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                          {order.phone && <span>{order.phone}</span>}
                          <span>• {order.method}</span>
                          <span>• {order.time}</span>
                        </div>
                        {order.event && (
                          <p className="text-[10px] text-primary-light font-medium mt-1">
                            {order.event}
                          </p>
                        )}
                      </div>

                      {/* Order Items */}
                      <div className="space-y-1.5 mb-4 text-xs">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-foreground">
                                <strong>{item.qty}x</strong> {item.name}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                Rp {(item.price * item.qty).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>1x Menu / Produk Tenant</span>
                            <span className="text-[11px]">Rp {(order.total || 0).toLocaleString("id-ID")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Total & Status Actions */}
                    <div>
                      <div className="flex items-center justify-between pt-3 border-t border-foreground/5 mb-4 text-xs">
                        <span className="text-muted-foreground">Total Pembayaran:</span>
                        <span className="font-bold text-foreground text-sm">
                          Rp {(order.total || 0).toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {currentStatus === "pending" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "making")}
                            className="btn btn-primary btn-sm w-full text-xs"
                            id={`btn-make-${order.id}`}
                          >
                            Mulai Buat (In Making)
                          </button>
                        )}
                        {currentStatus === "making" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="btn btn-primary btn-sm w-full"
                            id={`btn-ready-${order.id}`}
                          >
                            Tandai Siap Diambil
                          </button>
                        )}
                        {currentStatus === "ready" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "done")}
                            className="btn btn-secondary btn-sm w-full text-xs"
                            id={`btn-done-${order.id}`}
                          >
                            Serahkan &amp; Selesai
                          </button>
                        )}
                        {currentStatus === "done" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="btn btn-ghost btn-sm w-full text-xs text-muted-foreground"
                          >
                            Kembalikan ke Siap
                          </button>
                        )}
>>>>>>> Stashed changes
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => mediaFileInputRef.current?.click()}
              className="mt-5 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-secondary/50 transition cursor-pointer group"
            >
              <svg className="mx-auto mb-2 text-muted-foreground group-hover:text-secondary-light transition" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-muted-foreground">
                Upload brosur (PDF), foto galeri, atau video — <span className="text-secondary-light underline font-medium">klik atau drag &amp; drop</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, MP4. Max 50MB</p>
            </div>
          </div>

          {/* Mini Website Builder */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              🌐 Mini Website Builder
              <span className="badge badge-accent text-[10px]">AKTIF</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Halaman branding yang otomatis terbuka saat pengunjung mengetuk booth Anda di panduan digital.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Headline Brand</label>
                  <input
                    type="text"
                    className="input-base"
                    value={websiteConfig.headline}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, headline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tagline</label>
                  <input
                    type="text"
                    className="input-base"
                    value={websiteConfig.tagline}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tentang Brand / Nilai Bisnis</label>
                  <textarea
                    className="input-base min-h-[80px] resize-y"
                    value={websiteConfig.aboutText}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, aboutText: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Aksen Warna Brand</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg cursor-pointer"
                      value={websiteConfig.primaryColor}
                      onChange={(e) => setWebsiteConfig({ ...websiteConfig, primaryColor: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-base flex-1"
                      value={websiteConfig.primaryColor}
                      onChange={(e) => setWebsiteConfig({ ...websiteConfig, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Instagram</label>
                  <input
                    type="text"
                    className="input-base"
                    value={websiteConfig.socialLinks.instagram}
                    onChange={(e) =>
                      setWebsiteConfig({
                        ...websiteConfig,
                        socialLinks: { ...websiteConfig.socialLinks, instagram: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Website Resmi</label>
                  <input
                    type="url"
                    className="input-base"
                    value={websiteConfig.socialLinks.website}
                    onChange={(e) =>
                      setWebsiteConfig({
                        ...websiteConfig,
                        socialLinks: { ...websiteConfig.socialLinks, website: e.target.value },
                      })
                    }
                  />
                </div>
                <button type="button" onClick={handleSaveWebsite} className="btn btn-primary btn-sm" id="save-mini-website">
                  💾 Simpan Mini Website
                </button>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview Panduan Digital Pengunjung</p>
                <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-lg">
                  <div
                    className="h-24 flex items-center justify-center transition-colors"
                    style={{ background: `linear-gradient(135deg, ${websiteConfig.primaryColor}40, ${websiteConfig.primaryColor}15)` }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow"
                      style={{ backgroundColor: `${websiteConfig.primaryColor}30`, color: websiteConfig.primaryColor }}
                    >
                      {websiteConfig.headline.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
<<<<<<< Updated upstream
                  <div className="p-5 text-center">
                    <h3 className="font-bold text-lg mb-1">{websiteConfig.headline}</h3>
                    <p className="text-sm mb-3 font-medium" style={{ color: websiteConfig.primaryColor }}>
                      {websiteConfig.tagline}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {websiteConfig.aboutText}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">📸 {websiteConfig.socialLinks.instagram}</span>
                      <span className="text-xs text-muted-foreground">🌐 {websiteConfig.socialLinks.website}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Media */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card-base max-w-md w-full p-6 relative border border-border/80 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h3 className="text-lg font-bold">Tambah Media Promosi</h3>
              <button
                type="button"
                onClick={() => setShowAddMediaModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl p-1"
                id="close-add-media-modal"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMediaItem();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-semibold block mb-1">Nama Media / Dokumen</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lookbook Autumn 2026.pdf"
                  className="input-base text-sm w-full"
                  value={newMedia.name}
                  onChange={(e) => setNewMedia({ ...newMedia, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Tipe Media</label>
                <select
                  className="input-base text-sm w-full"
                  value={newMedia.type}
                  onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value })}
                >
                  <option value="PDF">PDF (Brosur / Company Profile)</option>
                  <option value="Galeri">Galeri Foto Produk</option>
                  <option value="Video">Video Promosi</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat materi..."
                  className="input-base text-sm w-full resize-none"
                  value={newMedia.description}
                  onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMediaModal(false)} className="btn btn-ghost btn-sm">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Media
                </button>
              </div>
            </form>
=======
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========== TAB 2: BOOTH SAYA & RIWAYAT SEWA ========== */}
      {activeTab === "booths" && (
        <div className="space-y-6">
          {holdGroups.map((group) => {
            const eventId = group[0].eventId;
            const labels = group.map((h) => h.booth);
            const until = group[0].reservedUntil ? new Date(group[0].reservedUntil).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={eventId} className="card-base p-5 border border-amber-500/30 bg-amber-500/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PaymentBadge status="pending" />
                    <span className="font-semibold text-sm">{group[0].event}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Booth {labels.join(", ")} ditahan{until ? ` sampai ${until}` : ""}. Booth baru menjadi milikmu setelah pembayaran dikonfirmasi.
                  </p>
                </div>
                <Link
                  href={`/dashboard/tenant/bookings/${eventId}/checkout?booths=${labels.map(encodeURIComponent).join(",")}`}
                  className="btn btn-primary btn-sm"
                >
                  Lanjutkan Pembayaran
                </Link>
              </div>
            );
          })}

          {bookings.length === 0 ? (
            <div className="card-base p-8 text-center border-dashed border-foreground/10">
              <span className="text-4xl block mb-2"><Icon name="store" size={32} /></span>
              <h3 className="font-bold text-sm mb-1 text-foreground">Belum Ada Booth yang Disewa</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
                Akun brand ini belum memiliki sewa booth aktif di event mana pun. Cari event dan daftarkan booth impianmu sekarang!
              </p>
              <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                Jelajahi Event Pameran
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="card-base p-6 border border-foreground/5 hover:border-primary/30 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center font-bold text-secondary text-base">
                        {booking.booth}
                      </div>
                      <PaymentBadge status={booking.payment} />
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-1">{booking.event}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {booking.date} • Booth {booking.booth}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Status sewa aktif. Booth ini telah terpetakan di Denah Pengunjung digital event.
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-foreground/5">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/events/${booking.eventId}/guide`}
                        className="btn btn-secondary btn-sm text-xs flex items-center justify-center gap-1"
                      >
                        Buka Denah
                      </Link>
                      <Link
                        href="/dashboard/tenant/catalog"
                        className="btn btn-secondary btn-sm text-xs flex items-center justify-center gap-1"
                      >
                        Atur Menu
                      </Link>
                    </div>
                    <button
                      onClick={() => setSelectedPass(booking)}
                      className="btn btn-primary btn-sm w-full text-xs flex items-center justify-center gap-1"
                      id={`open-pass-${booking.booth}`}
                    >
                      Lihat kartu tenant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== MODAL E-PASS BOOTH ========== */}
      {selectedPass && (
        <div className="modal-overlay" onClick={() => setSelectedPass(null)}>
          <div className="card-base max-w-sm w-full p-6 text-center border-primary/30 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg"
              aria-label="Tutup"
            >
              <Icon name="x" size={20} />
            </button>

            <span className="badge badge-primary text-[10px] mb-2">Kartu tenant resmi</span>
            <h3 className="font-bold text-lg text-foreground mb-1">{selectedPass.event}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedPass.date}</p>

            <div className="p-6 rounded-2xl bg-foreground/[0.03] border border-foreground/10 my-4 inline-block w-full">
              <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto flex items-center justify-center text-3xl font-semibold text-secondary shadow-xl mb-3">
                {selectedPass.booth}
              </div>
              <p className="text-xs font-semibold text-foreground">
                Nomor booth: {selectedPass.booth}
              </p>
              <p className={`text-[11px] font-medium mt-1 ${selectedPass.payment === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                {selectedPass.payment === "paid" ? "Terverifikasi & Lunas" : "Pembayaran belum terverifikasi"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                Kode booking: {selectedPass.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              Tunjukkan kartu ini ke panitia saat registrasi ulang dan saat memasukkan perlengkapan booth di lokasi acara.
            </p>

            <button
              onClick={() => setSelectedPass(null)}
              className="btn btn-primary btn-sm w-full"
            >
              Tutup
            </button>
>>>>>>> Stashed changes
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
