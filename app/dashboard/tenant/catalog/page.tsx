"use client";

import { useState, useEffect } from "react";

type CatalogType = "fnb" | "non-fnb";

type MenuItem = { id: string; name: string; price: number; description: string; stock: number; image: string };
type MediaItem = { id: string; name: string; type: string; description: string };

export default function CatalogPage() {
  const [catalogType, setCatalogType] = useState<CatalogType>("fnb");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: "1", name: "Nasi Goreng Kampung", price: 25000, description: "Nasi goreng dengan bumbu tradisional", stock: 50, image: "🍛" },
    { id: "2", name: "Sate Ayam Madura", price: 20000, description: "Sate ayam dengan bumbu kacang khas Madura", stock: 100, image: "🍢" },
    { id: "3", name: "Es Cendol Segar", price: 12000, description: "Cendol segar dengan santan dan gula merah", stock: 80, image: "🥤" },
  ]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: "1", name: "Company Profile.pdf", type: "PDF", description: "Profil perusahaan lengkap" },
    { id: "2", name: "Product Gallery", type: "Galeri", description: "Koleksi foto produk terbaru" },
    { id: "3", name: "Brand Video", type: "Video", description: "Video presentasi brand 2 menit" },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newMenu, setNewMenu] = useState({ name: "", price: 0, description: "", stock: 50 });

  // Mini website builder state
  const [websiteConfig, setWebsiteConfig] = useState({
    headline: "EcoWear Studio",
    tagline: "Fashion yang merawat bumi 🌿",
    aboutText: "Kami adalah brand fashion berkelanjutan yang menggunakan 100% bahan daur ulang. Setiap produk kami dibuat dengan cinta untuk bumi.",
    primaryColor: "#10b981",
    socialLinks: { instagram: "@ecowearstudio", website: "https://ecowear.id", whatsapp: "+6281234567890" },
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedMenu = localStorage.getItem("boothify_catalog_menu");
      if (storedMenu) setMenuItems(JSON.parse(storedMenu));
      const storedMedia = localStorage.getItem("boothify_catalog_media");
      if (storedMedia) setMediaItems(JSON.parse(storedMedia));
      const storedWebsite = localStorage.getItem("boothify_catalog_website");
      if (storedWebsite) setWebsiteConfig(JSON.parse(storedWebsite));
    } catch { /* ignore */ }
  }, []);

  // Auto-save to localStorage
  useEffect(() => { localStorage.setItem("boothify_catalog_menu", JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem("boothify_catalog_media", JSON.stringify(mediaItems)); }, [mediaItems]);
  useEffect(() => { localStorage.setItem("boothify_catalog_website", JSON.stringify(websiteConfig)); }, [websiteConfig]);

  const addMenuItem = () => {
    if (!newMenu.name) return;
    setMenuItems([...menuItems, { ...newMenu, id: String(menuItems.length + 1), price: Number(newMenu.price), stock: Number(newMenu.stock), image: "🍽️" }]);
    setNewMenu({ name: "", price: 0, description: "", stock: 50 });
    setShowAddMenu(false);
  };

  const removeMenuItem = (id: string) => setMenuItems(menuItems.filter((m) => m.id !== id));

  return (
    <div className="animate-fade-in" id="catalog-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Katalog Produk & Media</h1>
        <p className="text-sm text-muted-foreground">Kelola menu (F&B) atau media promosi digital yang akan ditampilkan kepada pengunjung</p>
      </div>

      {/* Type switcher */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setCatalogType("fnb")} className={`btn ${catalogType === "fnb" ? "btn-primary" : "btn-secondary"}`} id="switch-fnb">
          🍜 F&B — Menu Makanan
        </button>
        <button onClick={() => setCatalogType("non-fnb")} className={`btn ${catalogType === "non-fnb" ? "btn-primary" : "btn-secondary"}`} id="switch-non-fnb">
          📁 Non-F&B — Media Digital
        </button>
      </div>

      {/* ===== F&B CATALOG ===== */}
      {catalogType === "fnb" && (
        <div className="space-y-6">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Menu Makanan & Minuman</h2>
              <button onClick={() => setShowAddMenu(true)} className="btn btn-primary btn-sm" id="add-menu-btn">+ Tambah Menu</button>
            </div>

            {/* Add menu form */}
            {showAddMenu && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-5 space-y-3 animate-fade-in">
                <h3 className="text-sm font-semibold">Tambah Menu Baru</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" className="input-base" placeholder="Nama menu" value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} />
                  <input type="number" className="input-base" placeholder="Harga (Rp)" value={newMenu.price || ""} onChange={(e) => setNewMenu({ ...newMenu, price: Number(e.target.value) })} />
                </div>
                <input type="text" className="input-base" placeholder="Deskripsi" value={newMenu.description} onChange={(e) => setNewMenu({ ...newMenu, description: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={addMenuItem} className="btn btn-primary btn-sm">Simpan</button>
                  <button onClick={() => setShowAddMenu(false)} className="btn btn-ghost btn-sm">Batal</button>
                </div>
              </div>
            )}

            {/* Menu list */}
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                  <span className="text-3xl">{item.image}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-primary-light font-semibold">Rp {item.price.toLocaleString("id-ID")}</span>
                      <span className="text-muted-foreground">Stok: {item.stock}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm text-xs">Edit</button>
                    <button onClick={() => removeMenuItem(item.id)} className="btn btn-ghost btn-sm text-xs text-error">Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo upload */}
            <div className="mt-5 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition cursor-pointer">
              <svg className="mx-auto mb-2 text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <p className="text-sm text-muted-foreground">Upload foto menu — drag & drop atau <span className="text-primary-light">klik di sini</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ===== NON-F&B CATALOG ===== */}
      {catalogType === "non-fnb" && (
        <div className="space-y-6">
          {/* Media uploads */}
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Media Promosi Digital</h2>
              <button className="btn btn-primary btn-sm" id="add-media-btn">+ Upload Media</button>
            </div>

            <div className="space-y-3">
              {mediaItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02]">
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
                  <button className="btn btn-ghost btn-sm text-xs">Edit</button>
                </div>
              ))}
            </div>

            <div className="mt-5 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-secondary/50 transition cursor-pointer">
              <svg className="mx-auto mb-2 text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <p className="text-sm text-muted-foreground">Upload brosur (PDF), foto galeri, atau video — <span className="text-secondary-light">klik atau drag & drop</span></p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, MP4. Max 50MB</p>
            </div>
          </div>

          {/* Mini Website Builder */}
          <div className="card-base p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2">
              🌐 Mini Website Builder
              <span className="badge badge-accent text-[10px]">NEW</span>
            </h2>
            <p className="text-xs text-muted-foreground mb-5">Buat halaman branding sederhana untuk booth kamu — tampilkan pesan dan identitas brand</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Headline</label>
                  <input type="text" className="input-base" value={websiteConfig.headline} onChange={(e) => setWebsiteConfig({ ...websiteConfig, headline: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tagline</label>
                  <input type="text" className="input-base" value={websiteConfig.tagline} onChange={(e) => setWebsiteConfig({ ...websiteConfig, tagline: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tentang Brand</label>
                  <textarea className="input-base min-h-[80px] resize-y" value={websiteConfig.aboutText} onChange={(e) => setWebsiteConfig({ ...websiteConfig, aboutText: e.target.value })} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Warna Utama</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-10 rounded-lg cursor-pointer" value={websiteConfig.primaryColor} onChange={(e) => setWebsiteConfig({ ...websiteConfig, primaryColor: e.target.value })} />
                    <input type="text" className="input-base flex-1" value={websiteConfig.primaryColor} onChange={(e) => setWebsiteConfig({ ...websiteConfig, primaryColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Instagram</label>
                  <input type="text" className="input-base" value={websiteConfig.socialLinks.instagram} onChange={(e) => setWebsiteConfig({ ...websiteConfig, socialLinks: { ...websiteConfig.socialLinks, instagram: e.target.value } })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Website</label>
                  <input type="url" className="input-base" value={websiteConfig.socialLinks.website} onChange={(e) => setWebsiteConfig({ ...websiteConfig, socialLinks: { ...websiteConfig.socialLinks, website: e.target.value } })} />
                </div>
                <button className="btn btn-primary btn-sm" id="save-mini-website">💾 Simpan Mini Website</button>
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview</p>
                <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "var(--card)" }}>
                  {/* Header */}
                  <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${websiteConfig.primaryColor}33, ${websiteConfig.primaryColor}11)` }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl" style={{ backgroundColor: `${websiteConfig.primaryColor}33`, color: websiteConfig.primaryColor }}>
                      {websiteConfig.headline.slice(0, 2)}
                    </div>
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-bold text-lg mb-1">{websiteConfig.headline}</h3>
                    <p className="text-sm mb-3" style={{ color: websiteConfig.primaryColor }}>{websiteConfig.tagline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{websiteConfig.aboutText}</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs text-muted-foreground">📸 {websiteConfig.socialLinks.instagram}</span>
                      <span className="text-xs text-muted-foreground">🌐 Website</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
