"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthContext";
import Icon from "../../../components/Icon";
import FreshOnNavigate from "../../../components/FreshOnNavigate";
import { EmptyState, Field, PageHeader, TabPanel, Tabs } from "../../../components/ui";
import { getTenantUpcomingEvents, type TenantEvent } from "@/app/lib/tenant-events";
import { openStoredFile, uploadImage, uploadMediaFile } from "@/app/lib/file-upload";
import { getTenantMenu, saveTenantMenu, errorMessage } from "@/app/lib/db";

type MenuItem = { id: string; name: string; price: number; description: string; stock: number; image: string };
type MediaItem = { id: string; name: string; type: string; description: string; url?: string };
type MenuDraft = { name: string; price: string; description: string; stock: string; image: string };

const EMPTY_DRAFT: MenuDraft = { name: "", price: "", description: "", stock: "50", image: "" };

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
      </div>
    </div>
  );
}

function CatalogContent() {
  const { user, updateProfile } = useAuth();
  const tenantId = user?.id || "";

  const [events, setEvents] = useState<TenantEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
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

  // Events the tenant takes part in that have not ended yet
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    getTenantUpcomingEvents(tenantId)
      .then((list) => {
        if (cancelled) return;
        setEvents(list);
        setSelectedEventId((current) => (current && list.some((e) => e.id === current) ? current : list[0]?.id || ""));
      })
      .catch((err) => {
        if (!cancelled) showToast(errorMessage(err, "Event gagal dimuat."), "error");
      })
      .finally(() => {
        if (!cancelled) setEventsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

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

  const selectedEvent = events.find((e) => e.id === selectedEventId);

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
        description="Menu diatur per event. Media promosi dipakai di semua event yang kamu ikuti."
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
              <div className="mb-5 max-w-md">
                <label htmlFor="catalog-event" className="field-label">Atur menu untuk event</label>
                <select
                  id="catalog-event"
                  className="input-base"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}{ev.date ? ` (${ev.date})` : ""}
                    </option>
                  ))}
                </select>
                {selectedEvent && selectedEvent.booths.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Booth kamu: {selectedEvent.booths.join(", ")}</p>
                )}
                {menuLoading && <p className="text-xs text-muted-foreground mt-2">Memuat menu...</p>}
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
