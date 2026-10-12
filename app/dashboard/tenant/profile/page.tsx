"use client";

import { useState, useEffect } from "react";

const DEFAULT_PROFILE = {
  brandName: "EcoWear Studio",
  category: "fashion",
  email: "hello@ecowearstudio.id",
  phone: "+62 812 9876 5432",
  description: "Brand fashion berkelanjutan yang menggunakan 100% bahan daur ulang. Produk kami dibuat oleh pengrajin lokal dengan prinsip fair trade.",
  website: "https://ecowear.id",
  instagram: "@ecowearstudio",
};

export default function TenantProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_tenant_profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem("boothify_tenant_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const categories = [
    { value: "fnb", label: "🍜 Food & Beverage" },
    { value: "fashion", label: "👗 Fashion & Apparel" },
    { value: "automotive", label: "🚗 Automotive" },
    { value: "education", label: "📚 Education & Tech" },
    { value: "craft", label: "🎨 Craft & Handmade" },
    { value: "health", label: "🏥 Health & Wellness" },
    { value: "other", label: "📦 Lainnya" },
  ];

  return (
    <div className="animate-fade-in max-w-2xl" id="tenant-profile">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Brand</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi bisnis dan brand kamu</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center text-white text-2xl font-bold">
            EW
          </div>
          <div>
            <h2 className="font-semibold">{profile.brandName}</h2>
            <p className="text-sm text-muted-foreground">{categories.find((c) => c.value === profile.category)?.label}</p>
            <button className="btn btn-secondary btn-sm mt-2">Ganti Logo</button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="card-base p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Nama Brand / Toko</label>
          <input type="text" className="input-base" value={profile.brandName} onChange={(e) => setProfile({ ...profile, brandName: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Kategori Usaha</label>
          <select className="input-base" value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })}>
            {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" className="input-base" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telepon</label>
            <input type="tel" className="input-base" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi Brand</label>
          <textarea className="input-base min-h-[100px] resize-y" value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows={4} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input type="url" className="input-base" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <input type="text" className="input-base" value={profile.instagram} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} />
          </div>
        </div>
        <button type="button" onClick={handleSave} className="btn btn-primary" id="save-tenant-profile">{saved ? "✓ Tersimpan!" : "Simpan Perubahan"}</button>
      </form>
    </div>
  );
}
