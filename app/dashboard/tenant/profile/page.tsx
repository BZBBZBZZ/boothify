"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/AuthContext";
import { EVENT_CATEGORY_OPTIONS, getEventCategoryLabel } from "@/app/lib/event-categories";
import Icon from "../../../components/Icon";
import { uploadImage } from "@/app/lib/file-upload";
import { errorMessage } from "@/app/lib/db";
import FreshOnNavigate from "../../../components/FreshOnNavigate";

function TenantProfilePageContent() {
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    brandName: "",
    category: "",
    email: "",
    phone: "",
    description: "",
    website: "",
    instagram: "",
    logo: "" as string | undefined,
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [logoToast, setLogoToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fill the form once per account, so saving a logo does not wipe unsaved edits
  const filledFor = useRef("");
  useEffect(() => {
    if (!user || filledFor.current === user.id) return;
    filledFor.current = user.id;
    setProfile({
      brandName: user.businessName || user.name || "",
      category: user.businessCategory || "",
      email: user.email,
      phone: user.phone || "",
      description: user.description || "",
      website: user.website || "",
      instagram: user.instagram || "",
      logo: user.logoUrl || "",
    });
  }, [user]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    const result = await updateProfile({
      businessName: profile.brandName.trim(),
      businessCategory: profile.category,
      // F&B brands get an orderable menu in the visitor guide
      catalogType: profile.category === "fnb" ? "fnb" : "non-fnb",
      phone: profile.phone.trim(),
      description: profile.description.trim(),
      website: profile.website.trim(),
      instagram: profile.instagram.trim(),
    });
    setSaving(false);
    if (!result.success) {
      setSaveError(result.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !user) return;
          try {
            // Saved straight away so it shows here and in the mini website
            const logo = await uploadImage(user.id, file, "logo", 400);
            const result = await updateProfile({ logoUrl: logo });
            if (!result.success) throw new Error(result.message);
            setProfile((p) => ({ ...p, logo }));
            setLogoToast({ text: "Logo brand berhasil diperbarui.", tone: "ok" });
          } catch (err) {
            setLogoToast({ text: errorMessage(err, "Logo gagal diunggah."), tone: "error" });
          }
          window.setTimeout(() => setLogoToast(null), 3500);
        }}
      />
      {logoToast && (
        <div className={`page-toast ${logoToast.tone === "error" ? "page-toast--error" : ""}`} role="status">
          <Icon name={logoToast.tone === "error" ? "bell" : "check"} size={16} />
          <span>{logoToast.text}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Brand</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas usaha, kontak, dan profil toko untuk pameran</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-foreground text-2xl font-bold shadow-md overflow-hidden flex-shrink-0">
            {profile.logo ? (
              <img src={profile.logo} alt="Logo brand" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{profile.brandName}</h2>
            <p className="text-sm text-muted-foreground">{getEventCategoryLabel(profile.category)}</p>
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
            {EVENT_CATEGORY_OPTIONS.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Akun</label>
            <input
              type="email"
              className="input-base"
              value={profile.email}
              readOnly
              aria-describedby="tenant-email-note"
            />
            <p id="tenant-email-note" className="text-xs text-muted-foreground mt-1">Email dipakai untuk masuk dan tidak bisa diubah di sini.</p>
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
        {saveError && <p className="text-sm text-error" role="alert">{saveError}</p>}
        <button type="submit" className="btn btn-primary" id="save-tenant-profile" disabled={saving}>
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}

export default function TenantProfilePage() {
  return (
    <FreshOnNavigate>
      <TenantProfilePageContent />
    </FreshOnNavigate>
  );
}
