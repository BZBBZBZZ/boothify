"use client";

import { useState, useEffect } from "react";
<<<<<<< Updated upstream
import { useAuth } from "../../components/AuthContext";

type BookingItem = {
  event: string;
  booth: string;
  date: string;
  status: string;
  payment: string;
  eventId?: string;
  price?: number;
  tenantEmail?: string;
};

type VisitorOrderItem = {
  id: string;
  eventId?: string;
  event?: string;
  booth?: string;
  items: { boothId?: string; name: string; qty: number; price: number }[];
  total: number;
  customer: string;
  phone?: string;
  method: string;
  time: string;
  status?: "pending" | "making" | "ready" | "done";
  tenantEmail?: string;
  tenantName?: string;
};

import {
  getTenantBookingsFromSupabase,
  getVisitorOrdersFromSupabase,
  getEventsFromSupabase,
} from "@/app/lib/supabase-service";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [visitorOrders, setVisitorOrders] = useState<VisitorOrderItem[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Array<{ id: string; title: string; date: string; location: string; match: string; reason: string }>>([]);

  useEffect(() => {
    const email = user?.email || "demo-tenant@boothify.id";

    // 1. Load tenant bookings from Supabase
    getTenantBookingsFromSupabase(email).then((supabaseBookings) => {
      if (supabaseBookings && supabaseBookings.length > 0) {
        const mapped: BookingItem[] = supabaseBookings.map((b) => ({
          event: b.event,
          booth: b.booth,
          date: b.date || "2026",
          status: b.status || "confirmed",
          payment: b.payment || "paid",
          eventId: b.eventId,
          tenantEmail: b.tenantEmail,
          price: Number(b.amount?.replace(/\D/g, "") || 2500000),
        }));
        setBookings(mapped);
      } else {
        try {
          const stored = localStorage.getItem("boothify_tenant_bookings");
          if (stored) {
            const all = JSON.parse(stored);
            setBookings(all.filter((b: BookingItem) => b.tenantEmail === email));
          }
        } catch { /* ignore */ }
      }
    });

    // 2. Load recommendations dynamically from Supabase events
    getEventsFromSupabase().then((events) => {
      if (events && events.length > 0) {
        setRecommendedEvents(
          events.slice(0, 3).map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            location: e.location,
            match: "95%",
            reason: `Relevan dengan kategori ${e.category}`,
          }))
        );
      }
    });

    // 3. Load visitor orders from Supabase
    getVisitorOrdersFromSupabase(email).then((supabaseOrders) => {
      if (supabaseOrders && supabaseOrders.length > 0) {
        setVisitorOrders(
          supabaseOrders.map((o) => ({
            ...o,
            time: o.createdAt ? new Date(o.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "Baru saja",
          })) as VisitorOrderItem[]
        );
      } else {
        try {
          const stored = localStorage.getItem("boothify_visitor_orders");
          if (stored) {
            const parsed = JSON.parse(stored);
            setVisitorOrders(parsed);
          }
        } catch { /* ignore */ }
      }
    });
  }, [user]);

  const uniqueEventsCount = new Set(bookings.map((b) => b.event)).size;

  const updateOrderStatus = (orderId: string, newStatus: "pending" | "making" | "ready" | "done") => {
    setVisitorOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      const raw = localStorage.getItem("boothify_visitor_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map((o: VisitorOrderItem) => (o.id === orderId ? { ...o, status: newStatus } : o));
        localStorage.setItem("boothify_visitor_orders", JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }
  };
=======
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import Icon from "../../components/Icon";
import FreshOnNavigate from "../../components/FreshOnNavigate";
import { EmptyState, Field, PageHeader, TabPanel, Tabs } from "../../components/ui";
import { useTenantActiveEvent } from "@/app/lib/tenant-active-event";
import { openStoredFile, uploadImage, uploadMediaFile } from "@/app/lib/file-upload";
import { getTenantMenu, saveTenantMenu, errorMessage } from "@/app/lib/db";

type MenuItem = { id: string; name: string; price: number; description: string; stock: number; image: string };
type MediaItem = { id: string; name: string; type: string; description: string; url?: string };
type MenuDraft = { name: string; price: string; description: string; stock: string; image: string };

const EMPTY_DRAFT: MenuDraft = { name: "", price: "", description: "", stock: "50", image: "" };
>>>>>>> Stashed changes

/** Fields for adding or editing a menu item, each with its own label. */
function MenuFields({
  idPrefix,
  value,
  onChange,
  onPickImage,
  uploading,
}: {
  idPrefix: string;
  value: MenuDraft;
  onChange: (next: MenuDraft) => void;
  onPickImage: (file: File) => void;
  uploading: boolean;
}) {
  return (
<<<<<<< Updated upstream
    <div className="animate-fade-in" id="tenant-overview">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Dashboard Tenant</h1>
        <p className="text-muted-foreground text-sm">Kelola booth, produk, dan pantau pesanan kamu secara real-time.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📅</span>
            <span className="text-[11px] text-secondary-light font-medium">Aktif sekarang</span>
          </div>
          <div className="text-2xl font-bold mb-1">{uniqueEventsCount}</div>
          <div className="text-xs text-muted-foreground">Event Terdaftar</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🏪</span>
            <span className="text-[11px] text-secondary-light font-medium">Di {uniqueEventsCount} event</span>
          </div>
          <div className="text-2xl font-bold mb-1">{bookings.length}</div>
          <div className="text-xs text-muted-foreground">Booth Aktif</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💳</span>
            <span className="text-[11px] text-secondary-light font-medium">Bulan ini</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            Rp {(bookings.length * 2.5).toFixed(1)} Jt
          </div>
          <div className="text-xs text-muted-foreground">Total Investasi Booth</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📦</span>
            <span className="text-[11px] text-secondary-light font-medium">Live dari pengunjung</span>
          </div>
          <div className="text-2xl font-bold mb-1">{visitorOrders.length}</div>
          <div className="text-xs text-muted-foreground">Pesanan Masuk</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Bookings & Incoming Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Bookings */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Booth Saya</h2>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/tenant/catalog" className="btn btn-secondary btn-sm">
                  Kelola Menu &amp; Web
                </Link>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari Event Baru
                </Link>
              </div>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-xl p-6">
                <span className="text-3xl block mb-2">🏪</span>
                <p className="font-semibold text-foreground mb-1">Belum Ada Booth yang Disewa</p>
                <p className="text-xs mb-4">Akun brand ini belum memiliki sewa booth aktif. Jelajahi event yang cocok untuk brand kamu.</p>
                <Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">
                  Cari &amp; Sewa Booth Sekarang →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition border border-white/[0.03]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-sm">
                        {booking.booth}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{booking.event}</h3>
                        <p className="text-xs text-muted-foreground">{booking.date} • Booth {booking.booth}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge text-[10px] ${booking.payment === "paid" ? "badge-primary" : "badge-accent"}`}>
                        {booking.payment === "paid" ? "✓ Lunas" : "⏳ Pending"}
                      </span>
                      <Link
                        href={`/events/${booking.eventId || "1"}/guide`}
                        className="btn btn-ghost btn-sm text-xs text-primary-light"
                        title="Lihat tampilan booth di Denah Pengunjung"
                      >
                        Buka Denah ↗
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming Orders from Visitors */}
          <div className="card-base p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-semibold text-foreground">Pesanan Masuk dari Pengunjung (Live)</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary text-[10px]">{visitorOrders.length} Pesanan</span>
                <Link href="/dashboard/tenant/bookings" className="btn btn-ghost btn-sm text-[11px] text-primary-light">
                  Buka KDS Penuh →
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pesanan yang dibuat oleh pengunjung melalui scan QR Code / Digital Guide di booth kamu. Ubah status pesanan secara real-time.
            </p>

            {visitorOrders.length === 0 ? (
              <div className="p-6 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                <span className="text-3xl block mb-2">📋</span>
                <p className="font-semibold text-xs text-foreground mb-1">Belum Ada Pesanan Masuk</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Saat pengunjung memindai QR Code di booth kamu atau memesan produk via Panduan Digital, pesanan baru akan langsung masuk ke sini secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitorOrders.slice(0, 5).map((order) => {
                  const status = order.status || "pending";
                  const boothLabel = order.booth || order.items[0]?.boothId || "A1";
                  return (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                        status === "making"
                          ? "bg-sky-500/[0.04] border-sky-500/30"
                          : status === "ready"
                          ? "bg-emerald-500/[0.04] border-emerald-500/40"
                          : status === "done"
                          ? "bg-white/[0.01] border-white/5 opacity-70"
                          : "bg-amber-500/[0.03] border-amber-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold font-mono text-primary-light">{order.id}</span>
                          <span className="badge badge-secondary text-[10px] font-semibold">
                            🏪 Booth {boothLabel}
                          </span>
                          <span className="badge badge-secondary text-[9px]">{order.method}</span>
                          <span className="text-[10px] text-muted-foreground">{order.time}</span>
                          {status === "pending" && (
                            <span className="badge text-[9px] bg-amber-500/15 text-amber-400">🟡 Baru Masuk</span>
                          )}
                          {status === "making" && (
                            <span className="badge text-[9px] bg-sky-500/15 text-sky-400 animate-pulse">🔵 Sedang Dibuat</span>
                          )}
                          {status === "ready" && (
                            <span className="badge text-[9px] bg-emerald-500/15 text-emerald-400">🟢 Siap Diambil</span>
                          )}
                          {status === "done" && (
                            <span className="badge text-[9px] bg-white/10 text-muted-foreground">✅ Selesai</span>
                          )}
                        </div>
                        <p className="font-medium text-foreground mt-1">
                          {order.customer} {order.phone && <span className="text-muted-foreground font-normal">({order.phone})</span>}
                        </p>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          {order.items && order.items.length > 0
                            ? order.items.map((it) => `${it.qty}x ${it.name}`).join(", ")
                            : "1x Produk Tenant"}
                        </p>
                      </div>
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <span className="font-bold text-foreground text-sm">
                          Rp {(order.total || 185000).toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {status === "pending" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "making")}
                              className="btn btn-primary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-make-${order.id}`}
                            >
                              🍳 Buat
                            </button>
                          )}
                          {status === "making" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "ready")}
                              className="btn btn-sm text-[11px] py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                              id={`dash-ready-${order.id}`}
                            >
                              🔔 Siap
                            </button>
                          )}
                          {status === "ready" && (
                            <button
                              onClick={() => updateOrderStatus(order.id, "done")}
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
                              id={`dash-done-${order.id}`}
                            >
                              ✓ Selesai
                            </button>
                          )}
                          {status === "done" && (
                            <span className="text-muted-foreground text-[11px]">Selesai</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Recommended Events */}
        <div>
          <div className="card-base p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              Rekomendasi AI
              <span className="badge badge-secondary text-[10px]">✨ SMART</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Event yang cocok dengan profil produk kamu</p>
            <div className="space-y-3">
              {recommendedEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <span className="text-xs font-bold text-primary-light">{event.match}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{event.date} • {event.location}</p>
                  <p className="text-[11px] text-secondary-light">💡 {event.reason}</p>
                </Link>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Rekomendasi berdasarkan AI matching — template UI untuk integrasi Gemini API
            </p>
          </div>
        </div>
=======
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nama menu" required id={`${idPrefix}-name`} hint="Nama yang dilihat pengunjung saat memesan.">
          {(id) => <input
            id={id}
            type="text"
            className="input-base"
            placeholder="Contoh: Kopi Susu Gula Aren"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            required
          />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Harga (Rp)" required id={`${idPrefix}-price`} hint="Tanpa titik, contoh 22000.">
            {(id) => <input
              id={id}
              type="number"
              min={0}
              inputMode="numeric"
              className="input-base"
              placeholder="22000"
              value={value.price}
              onChange={(e) => onChange({ ...value, price: e.target.value })}
              required
            />}
          </Field>
          <Field label="Stok tersedia" id={`${idPrefix}-stock`} hint="Porsi/barang yang siap dijual.">
            {(id) => <input
              id={id}
              type="number"
              min={0}
              inputMode="numeric"
              className="input-base"
              value={value.stock}
              onChange={(e) => onChange({ ...value, stock: e.target.value })}
            />}
          </Field>
        </div>
      </div>
      <Field label="Deskripsi menu" optional id={`${idPrefix}-desc`}>
        {(id) => <textarea
          id={id}
          className="input-base min-h-[80px] resize-y"
          placeholder="Contoh: racikan rempah atau varian rasa"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3}
        />}
      </Field>
      <div>
        <p className="field-label">Foto menu <span className="field-tag">Opsional</span></p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="menu-image-preview">
            {value.image ? (
              <img src={value.image} alt="" />
            ) : (
              <Icon name="utensils" size={24} />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="btn btn-secondary btn-sm cursor-pointer">
              {uploading ? "Mengunggah..." : value.image ? "Ganti foto" : "Unggah foto"}
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPickImage(file);
                  e.target.value = "";
                }}
              />
            </label>
            {value.image && (
              <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => onChange({ ...value, image: "" })}>
                Hapus foto
              </button>
            )}
          </div>
        </div>
        <p className="field-hint">JPG, PNG, atau WebP. Foto diperkecil otomatis.</p>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

function CatalogContent() {
  const { user, updateProfile } = useAuth();
  const tenantId = user?.id || "";

  // The event is picked in the sidebar ("Event dipilih"), shared with Pesanan & Booth
  const { events, loaded: eventsLoaded, error: eventsError, eventId: selectedEventId, event: selectedEvent } = useTenantActiveEvent(tenantId);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenu, setNewMenu] = useState<MenuDraft>(EMPTY_DRAFT);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingMenuData, setEditingMenuData] = useState<MenuDraft>(EMPTY_DRAFT);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [tab, setTab] = useState<"menu" | "media">("menu");

  const showToast = (text: string, tone: "ok" | "error" = "ok") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (eventsError) showToast(eventsError, "error");
  }, [eventsError]);

  // Media is part of the tenant profile and shown at every event
  useEffect(() => {
    setMediaItems(
      (user?.mediaFiles || []).map((m, i) => ({
        id: m.id || `${i}-${m.name}`,
        name: m.name,
        type: m.type,
        url: m.url,
        description: m.description || "",
      }))
    );
  }, [user?.mediaFiles]);

  // The menu belongs to the selected event
  useEffect(() => {
    setShowAddMenu(false);
    setEditingMenuId(null);
    if (!tenantId || !selectedEventId) {
      setMenuItems([]);
      return;
    }
    let cancelled = false;
    setMenuLoading(true);
    getTenantMenu(tenantId, selectedEventId)
      .then((menu) => {
        if (cancelled) return;
        setMenuItems(
          menu.map((m, i) => ({
            id: m.id || `${i}-${m.name}`,
            name: m.name,
            price: Number(m.price) || 0,
            description: m.description || "",
            stock: Number(m.stock) || 0,
            image: m.image || "",
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) showToast(errorMessage(err, "Menu gagal dimuat."), "error");
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, selectedEventId]);

  const saveMenu = async (next: MenuItem[], message: string): Promise<boolean> => {
    if (!selectedEventId || saving) return false;
    setSaving(true);
    try {
      await saveTenantMenu(tenantId, selectedEventId, next);
      setMenuItems(next);
      showToast(message);
      return true;
    } catch (err) {
      showToast(errorMessage(err, "Menu gagal disimpan."), "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveMedia = async (next: MediaItem[], message: string): Promise<boolean> => {
    setSaving(true);
    const result = await updateProfile({
      mediaFiles: next.map((m) => ({ id: m.id, name: m.name, type: m.type, url: m.url, description: m.description })),
    });
    setSaving(false);
    if (!result.success) {
      showToast(result.message, "error");
      return false;
    }
    setMediaItems(next);
    showToast(message);
    return true;
  };

  const draftToItem = (draft: MenuDraft, id: string): MenuItem => ({
    id,
    name: draft.name.trim(),
    price: Number(draft.price) || 0,
    description: draft.description.trim(),
    stock: Number(draft.stock) || 0,
    image: draft.image,
  });

  const pickImage = async (file: File, apply: (url: string) => void) => {
    setUploadingImage(true);
    try {
      apply(await uploadImage(tenantId, file, "menu", 900));
    } catch (err) {
      showToast(errorMessage(err, "Gambar gagal diunggah."), "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const addMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenu.name.trim()) return;
    if (menuItems.some((m) => m.name.toLowerCase() === newMenu.name.trim().toLowerCase())) {
      showToast("Nama menu sudah ada. Gunakan nama lain.", "error");
      return;
    }
    const saved = await saveMenu([...menuItems, draftToItem(newMenu, String(Date.now()))], "Menu berhasil ditambahkan.");
    if (saved) {
      setNewMenu(EMPTY_DRAFT);
      setShowAddMenu(false);
    }
  };

  const saveEditMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuId || !editingMenuData.name.trim()) return;
    if (menuItems.some((m) => m.id !== editingMenuId && m.name.toLowerCase() === editingMenuData.name.trim().toLowerCase())) {
      showToast("Nama menu sudah ada. Gunakan nama lain.", "error");
      return;
    }
    const saved = await saveMenu(
      menuItems.map((item) => (item.id === editingMenuId ? draftToItem(editingMenuData, item.id) : item)),
      "Perubahan menu disimpan."
    );
    if (saved) setEditingMenuId(null);
  };

  const uploadMedia = async (file: File) => {
    setUploadingMedia(true);
    try {
      const stored = await uploadMediaFile(tenantId, file);
      await saveMedia(
        [
          ...mediaItems,
          {
            id: String(Date.now()),
            name: stored.name,
            type: stored.type,
            url: stored.url,
            description: `Diunggah ${new Date().toLocaleDateString("id-ID")}`,
          },
        ],
        `File "${stored.name}" berhasil diunggah.`
      );
    } catch (err) {
      showToast(errorMessage(err, "File gagal diunggah."), "error");
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <div className="animate-fade-in relative" id="catalog-page">
      {toast && (
        <div className={`page-toast ${toast.tone === "error" ? "page-toast--error" : ""}`} role="status">
          <Icon name={toast.tone === "error" ? "bell" : "check"} size={16} />
          <span>{toast.text}</span>
        </div>
      )}

      <PageHeader
        title="Katalog produk"
        description={
          selectedEvent
            ? <>Menu untuk <span className="text-foreground font-semibold">{selectedEvent.title}</span>. Ganti event lewat &quot;Event dipilih&quot; di menu samping. Media promosi berlaku di semua event.</>
            : "Menu diatur per event. Pilih event lewat \"Event dipilih\" di menu samping. Media promosi berlaku di semua event."
        }
      />

      <Tabs<"menu" | "media">
        label="Bagian katalog"
        idPrefix="catalog"
        active={tab}
        onChange={setTab}
        items={[
          { key: "menu", label: "Menu per event", count: menuItems.length },
          { key: "media", label: "Media promosi", count: mediaItems.length },
        ]}
      />

      <div className="space-y-6">
        {/* ===== MENU PER EVENT ===== */}
        {tab === "menu" && (
          <TabPanel idPrefix="catalog" tabKey="menu">
            <section className="card-base p-6" aria-labelledby="menu-heading">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 id="menu-heading" className="section-title">Menu makanan &amp; minuman</h2>
                  <p className="section-desc">Pengunjung bisa langsung memesan produk ini di event yang dipilih.</p>
                </div>
                {selectedEventId && !showAddMenu && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMenuId(null);
                      setNewMenu(EMPTY_DRAFT);
                      setShowAddMenu(true);
                    }}
                    className="btn btn-primary btn-sm"
                    id="add-menu-btn"
                  >
                    + Tambah menu
                  </button>
                )}
              </div>

              {!eventsLoaded ? (
                <p className="text-sm text-muted-foreground py-6">Memuat event yang kamu ikuti...</p>
              ) : events.length === 0 ? (
                <EmptyState
                  icon={<Icon name="calendar" size={32} />}
                  title="Belum ada event yang kamu ikuti"
                  text="Menu dibuat per event. Sewa booth di event yang akan datang, lalu atur menunya di sini."
                  action={<Link href="/dashboard/tenant/events" className="btn btn-primary btn-sm">Cari event</Link>}
                />
              ) : (
                <>
                  <div className="mb-5 text-xs text-muted-foreground space-y-1">
                    {selectedEvent && (
                      <p>
                        {selectedEvent.date && <>{selectedEvent.date} · </>}
                        {selectedEvent.booths.length > 0 ? `Booth kamu: ${selectedEvent.booths.join(", ")}` : selectedEvent.heldBooths.length > 0 ? `Booth ${selectedEvent.heldBooths.join(", ")} menunggu pembayaran` : ""}
                      </p>
                    )}
                    {selectedEvent && !selectedEvent.upcoming && (
                      <p className="text-amber-700">Event ini sudah selesai. Menu masih bisa dilihat dan diubah untuk arsip.</p>
                    )}
                    {menuLoading && <p>Memuat menu...</p>}
                  </div>

                  {showAddMenu && (
                    <form onSubmit={addMenuItem} className="menu-form mb-5 animate-fade-in">
                      <h3 className="section-title mb-4">Tambah menu baru</h3>
                      <MenuFields
                        idPrefix="new-menu"
                        value={newMenu}
                        onChange={setNewMenu}
                        uploading={uploadingImage}
                        onPickImage={(file) => pickImage(file, (url) => setNewMenu((d) => ({ ...d, image: url })))}
                      />
                      <div className="flex flex-wrap gap-2 mt-5">
                        <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingImage || saving}>Simpan menu</button>
                        <button type="button" onClick={() => setShowAddMenu(false)} className="btn btn-ghost btn-sm">Batal</button>
                      </div>
                    </form>
                  )}

                  {menuItems.length === 0 ? (
                    <EmptyState
                      icon={<Icon name="utensils" size={32} />}
                      title="Belum ada menu untuk event ini"
                      text="Tambahkan menu makanan, minuman, atau produk untuk mulai menerima pesanan."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {menuItems.map((item) => (
                        <li key={item.id} className="menu-row">
                          {editingMenuId === item.id ? (
                            <form onSubmit={saveEditMenuItem} className="animate-fade-in">
                              <h3 className="section-title mb-4">Edit menu: {item.name}</h3>
                              <MenuFields
                                idPrefix={`edit-${item.id}`}
                                value={editingMenuData}
                                onChange={setEditingMenuData}
                                uploading={uploadingImage}
                                onPickImage={(file) => pickImage(file, (url) => setEditingMenuData((d) => ({ ...d, image: url })))}
                              />
                              <div className="flex flex-wrap gap-2 mt-5">
                                <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingImage || saving}>Simpan perubahan</button>
                                <button type="button" onClick={() => setEditingMenuId(null)} className="btn btn-ghost btn-sm">Batal</button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                              <div className="menu-image-thumb">
                                {item.image ? (
                                  <img src={item.image} alt="" />
                                ) : (
                                  <span className="mono-chip" aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm">{item.name}</h3>
                                {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                                  <span className="text-primary-light font-semibold">Rp {item.price.toLocaleString("id-ID")}</span>
                                  <span className="text-muted-foreground">Stok: {item.stock}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddMenu(false);
                                    setEditingMenuId(item.id);
                                    setEditingMenuData({
                                      name: item.name,
                                      price: String(item.price),
                                      description: item.description,
                                      stock: String(item.stock),
                                      image: item.image || "",
                                    });
                                  }}
                                  className="btn btn-ghost btn-sm text-xs"
                                  aria-label={`Edit menu ${item.name}`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Hapus menu "${item.name}"?`)) saveMenu(menuItems.filter((m) => m.id !== item.id), "Menu dihapus.");
                                  }}
                                  className="btn btn-ghost btn-sm text-xs text-error"
                                  aria-label={`Hapus menu ${item.name}`}
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </TabPanel>
        )}

        {/* ===== MEDIA PROMOSI ===== */}
        {tab === "media" && (
          <TabPanel idPrefix="catalog" tabKey="media">
            <section className="card-base p-6" aria-labelledby="media-heading">
              <div className="mb-5">
                <h2 id="media-heading" className="section-title">Media promosi</h2>
                <p className="section-desc">Brosur, lookbook, foto galeri, dan video yang bisa dibuka pengunjung.</p>
              </div>

              {mediaItems.length > 0 && (
                <ul className="space-y-3 mb-5">
                  {mediaItems.map((item) => (
                    <li key={item.id} className="menu-row">
                      {editingMediaId === item.id ? (
                        <div className="space-y-4 animate-fade-in">
                          <div>
                            <label htmlFor={`media-name-${item.id}`} className="field-label">Nama file</label>
                            <input
                              id={`media-name-${item.id}`}
                              type="text"
                              className="input-base"
                              value={item.name}
                              onChange={(e) => setMediaItems(mediaItems.map((m) => (m.id === item.id ? { ...m, name: e.target.value } : m)))}
                            />
                          </div>
                          <div>
                            <label htmlFor={`media-desc-${item.id}`} className="field-label">Keterangan</label>
                            <input
                              id={`media-desc-${item.id}`}
                              type="text"
                              className="input-base"
                              value={item.description}
                              onChange={(e) => setMediaItems(mediaItems.map((m) => (m.id === item.id ? { ...m, description: e.target.value } : m)))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMediaId(null);
                              saveMedia(mediaItems, "Media diperbarui.");
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            Simpan
                          </button>
                          <button type="button" onClick={() => setEditingMediaId(null)} className="btn btn-ghost btn-sm ml-2">
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                          <div className="media-type-icon" aria-hidden="true">
                            <Icon name={item.type === "PDF" ? "clipboard" : item.type === "Video" ? "phone" : "folder"} size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm break-words">{item.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <span className="badge badge-secondary">{item.type}</span>
                          <div className="flex items-center gap-2">
                            {item.url && (
                              <button type="button" onClick={() => openStoredFile(item.url!)} className="btn btn-secondary btn-sm text-xs">
                                Buka
                              </button>
                            )}
                            <button type="button" onClick={() => setEditingMediaId(item.id)} className="btn btn-ghost btn-sm text-xs">Edit</button>
                            <button
                              type="button"
                              onClick={() => saveMedia(mediaItems.filter((m) => m.id !== item.id), "Media dihapus.")}
                              className="btn btn-ghost btn-sm text-xs text-error"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <label className={`upload-drop ${uploadingMedia ? "is-busy" : ""}`}>
                <Icon name="folder" size={32} />
                <span className="text-sm font-medium">
                  {uploadingMedia ? "Mengunggah..." : "Unggah brosur (PDF), foto galeri, atau video"}
                </span>
                <span className="text-xs text-muted-foreground">PDF dan video maks. 1,5 MB. Foto diperkecil otomatis.</span>
                <input
                  type="file"
                  accept=".pdf,image/*,video/*"
                  className="visually-hidden"
                  disabled={uploadingMedia}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMedia(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </section>
          </TabPanel>
        )}

        <p className="text-sm text-muted-foreground">
          Logo, tagline, dan warna booth diatur di{" "}
          <Link href="/dashboard/tenant/mini-website" className="text-primary-light font-semibold underline">Mini Website</Link>.
        </p>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <FreshOnNavigate>
      <CatalogContent />
    </FreshOnNavigate>
  );
}