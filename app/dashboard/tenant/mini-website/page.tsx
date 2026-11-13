"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/components/AuthContext";
import Icon from "../../../components/Icon";
import FreshOnNavigate from "../../../components/FreshOnNavigate";
import { uploadImage } from "@/app/lib/file-upload";
import { errorMessage } from "@/app/lib/db";

type WebsiteConfig = {
  logo?: string;
  headline: string;
  tagline: string;
  aboutText: string;
  primaryColor: string;
  socialLinks: { instagram: string; website: string; whatsapp: string };
};

function MiniWebsiteContent() {
  const { user, updateProfile } = useAuth();

  const [config, setConfig] = useState<WebsiteConfig>({
    headline: "",
    tagline: "",
    aboutText: "",
    primaryColor: "#c2410c",
    socialLinks: { instagram: "", website: "", whatsapp: "" },
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const showToast = (text: string, tone: "ok" | "error" = "ok") => {
    setToast({ text, tone });
    window.setTimeout(() => setToast(null), 3500);
  };

  // Start from the saved mini website, filling gaps from the tenant profile
  // Fill the form once per account, so later profile refreshes do not wipe unsaved edits
  const filledFor = useRef("");
  useEffect(() => {
    if (!user || filledFor.current === user.id) return;
    filledFor.current = user.id;
    const b = user.branding || {};
    setConfig({
      logo: b.logo || user.logoUrl,
      headline: b.headline || user.businessName || user.name || "",
      tagline: b.tagline || "",
      aboutText: b.aboutText || user.description || "",
      primaryColor: b.primaryColor || "#c2410c",
      socialLinks: {
        instagram: b.instagram || user.instagram || "",
        website: b.website || user.website || "",
        whatsapp: b.whatsapp || user.phone || "",
      },
    });
  }, [user]);

  const handleLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadImage(user.id, file, "logo", 400);
      setConfig((c) => ({ ...c, logo: url }));
      showToast("Logo diunggah. Klik Simpan Mini Website untuk menerapkan.");
    } catch (err) {
      showToast(errorMessage(err, "Logo gagal diunggah."), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    // Every booth this tenant holds shows the same branding in the visitor guide
    const result = await updateProfile({
      branding: {
        logo: config.logo || "",
        headline: config.headline.trim(),
        tagline: config.tagline.trim(),
        aboutText: config.aboutText.trim(),
        primaryColor: config.primaryColor,
        instagram: config.socialLinks.instagram.trim(),
        website: config.socialLinks.website.trim(),
        whatsapp: config.socialLinks.whatsapp.trim(),
      },
    });
    setSaving(false);
    showToast(result.success ? "Mini website disimpan." : result.message, result.success ? "ok" : "error");
  };

  const initials = (config.headline || "BR").slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in relative" id="mini-website-page">
      {toast && (
        <div className={`page-toast ${toast.tone === "error" ? "page-toast--error" : ""}`} role="status">
          <Icon name={toast.tone === "error" ? "bell" : "check"} size={16} />
          <span>{toast.text}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Mini Website Builder</h1>
        <p className="text-sm text-muted-foreground">
          Halaman branding yang terbuka saat pengunjung mengetuk booth kamu di panduan digital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSave} className="card-base p-6 space-y-5">
          <div>
            <p className="field-label">Logo Brand</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="menu-image-preview">
                {config.logo ? (
                  <img src={config.logo} alt="Logo brand" />
                ) : (
                  <span className="font-semibold">{initials}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="btn btn-secondary btn-sm cursor-pointer">
                  {uploading ? "Mengunggah..." : config.logo ? "Ganti Logo" : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="visually-hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogo(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {config.logo && (
                  <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => setConfig((c) => ({ ...c, logo: undefined }))}>
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="mw-headline" className="field-label">Headline Brand</label>
            <input id="mw-headline" type="text" className="input-base" value={config.headline} onChange={(e) => setConfig({ ...config, headline: e.target.value })} />
          </div>
          <div>
            <label htmlFor="mw-tagline" className="field-label">Tagline</label>
            <input id="mw-tagline" type="text" className="input-base" value={config.tagline} onChange={(e) => setConfig({ ...config, tagline: e.target.value })} />
          </div>
          <div>
            <label htmlFor="mw-about" className="field-label">Tentang Brand</label>
            <textarea id="mw-about" className="input-base min-h-[96px] resize-y" rows={4} value={config.aboutText} onChange={(e) => setConfig({ ...config, aboutText: e.target.value })} />
          </div>
          <div>
            <label htmlFor="mw-color-text" className="field-label">Warna Brand</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Pilih warna brand"
                className="color-swatch"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
              <input id="mw-color-text" type="text" className="input-base flex-1" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mw-instagram" className="field-label">Instagram</label>
              <input
                id="mw-instagram"
                type="text"
                className="input-base"
                value={config.socialLinks.instagram}
                onChange={(e) => setConfig({ ...config, socialLinks: { ...config.socialLinks, instagram: e.target.value } })}
              />
            </div>
            <div>
              <label htmlFor="mw-website" className="field-label">Website Resmi</label>
              <input
                id="mw-website"
                type="url"
                className="input-base"
                value={config.socialLinks.website}
                onChange={(e) => setConfig({ ...config, socialLinks: { ...config.socialLinks, website: e.target.value } })}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" id="save-mini-website" disabled={uploading || saving}>
            Simpan Mini Website
          </button>
        </form>

        <div>
          <p className="field-label">Preview di panduan pengunjung</p>
          <div className="card-base overflow-hidden">
            <div className="mini-preview-head" style={{ background: config.primaryColor }}>
              <div className="mini-preview-logo">
                {config.logo ? (
                  <img src={config.logo} alt="" />
                ) : (
                  <span style={{ color: config.primaryColor }}>{initials}</span>
                )}
              </div>
            </div>
            <div className="p-6 text-center">
              <h3 className="font-bold text-lg mb-1 break-words">{config.headline}</h3>
              <p className="text-sm mb-3 font-medium break-words" style={{ color: config.primaryColor }}>{config.tagline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 break-words">{config.aboutText}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 border-t border-border text-xs text-muted-foreground">
                {config.socialLinks.instagram && <span>{config.socialLinks.instagram}</span>}
                {config.socialLinks.website && <span className="break-all">{config.socialLinks.website}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MiniWebsitePage() {
  return (
    <FreshOnNavigate>
      <MiniWebsiteContent />
    </FreshOnNavigate>
  );
}
