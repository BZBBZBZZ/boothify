"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/AuthContext";

export default function TenantProfilePage() {
  const { user, updateProfile } = useAuth();
  const email = user?.email || "demo-tenant@boothify.id";
  const isKopi = email === "kopi@boothify.id";

  const [profile, setProfile] = useState({
    brandName: user?.businessName || (isKopi ? "Kopi Keliling Nusantara" : "EcoWear Studio"),
    category: user?.category || (isKopi ? "fnb" : "fashion"),
    email: user?.email || "demo-tenant@boothify.id",
    phone: user?.phone || (isKopi ? "+62 812 3456 7890" : "+62 812 9876 5432"),
    description: user?.description || (isKopi
      ? "Spesialisasi seduhan kopi keliling dan espresso bar di event pameran dan festival."
      : "Brand fashion berkelanjutan yang menggunakan 100% bahan daur ulang. Produk kami dibuat oleh pengrajin lokal dengan prinsip fair trade."),
    website: user?.website || (isKopi ? "https://kopikeliling.id" : "https://ecowear.id"),
    instagram: user?.instagram || (isKopi ? "@kopikeliling.id" : "@ecowearstudio"),
  });

  const [saved, setSaved] = useState(false);
  const [logoToast, setLogoToast] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`boothify_profile_${email}`);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else if (user) {
        setProfile({
          brandName: user.businessName || (isKopi ? "Kopi Keliling Nusantara" : "EcoWear Studio"),
          category: user.category || (isKopi ? "fnb" : "fashion"),
          email: user.email,
          phone: user.phone || (isKopi ? "+62 812 3456 7890" : "+62 812 9876 5432"),
          description: user.description || (isKopi
            ? "Spesialisasi seduhan kopi keliling dan espresso bar di event pameran dan festival."
            : "Brand fashion berkelanjutan yang menggunakan 100% bahan daur ulang."),
          website: user.website || (isKopi ? "https://kopikeliling.id" : "https://ecowear.id"),
          instagram: user.instagram || (isKopi ? "@kopikeliling.id" : "@ecowearstudio"),
        });
      }
    } catch {
      // ignore
    }
  }, [user, email, isKopi]);

  const handleSave = () => {
    try {
      localStorage.setItem(`boothify_profile_${email}`, JSON.stringify(profile));
      if (email === "demo-tenant@boothify.id") {
        localStorage.setItem("boothify_tenant_profile", JSON.stringify(profile));
      }
      updateProfile({
        businessName: profile.brandName,
        category: profile.category,
        phone: profile.phone,
        description: profile.description,
        website: profile.website,
        instagram: profile.instagram,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    }
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

  const initials = (profile.brandName || "TN")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="animate-fade-in max-w-2xl relative" id="tenant-profile">
      <input
        type="file"
        ref={logoInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setLogoToast(true);
            setTimeout(() => setLogoToast(false), 3000);
          }
        }}
      />
      {logoToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium text-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-xs font-bold">✓</div>
          Logo brand berhasil diperbarui!
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Brand</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas usaha, kontak, dan profil toko untuk pameran</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center text-foreground text-2xl font-bold shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{profile.brandName}</h2>
            <p className="text-sm text-muted-foreground">{categories.find((c) => c.value === profile.category)?.label || profile.category}</p>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="btn btn-secondary btn-sm mt-2"
              id="change-brand-logo"
            >
              Ganti Logo
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="card-base p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Nama Brand / Toko</label>
          <input
            type="text"
            required
            className="input-base"
            value={profile.brandName}
            onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Kategori Usaha</label>
          <select
            className="input-base"
            value={profile.category}
            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Bisnis</label>
            <input
              type="email"
              className="input-base"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nomor Telepon / WhatsApp</label>
            <input
              type="tel"
              className="input-base"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi Brand</label>
          <textarea
            className="input-base min-h-[100px] resize-y"
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={4}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              className="input-base"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <input
              type="text"
              className="input-base"
              value={profile.instagram}
              onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" id="save-tenant-profile">
          {saved ? "✓ Tersimpan!" : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
