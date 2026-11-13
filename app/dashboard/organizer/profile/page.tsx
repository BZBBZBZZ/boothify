"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/AuthContext";
import Icon from "../../../components/Icon";
import FreshOnNavigate from "../../../components/FreshOnNavigate";
import { uploadImage } from "@/app/lib/file-upload";
import { listOrganizerEvents, errorMessage } from "@/app/lib/db";
import type { EventDetail } from "@/app/lib/event-defaults";

function OrganizerProfilePageContent() {
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    orgName: "",
    email: "",
    phone: "",
    description: "",
    website: "",
    instagram: "",
  });
  const [logo, setLogo] = useState("");
  const [portfolio, setPortfolio] = useState<EventDetail[]>([]);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoToast, setPhotoToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Fill the form once per account, so saving a photo does not wipe unsaved edits
  const filledFor = useRef("");
  useEffect(() => {
    if (!user || filledFor.current === user.id) return;
    filledFor.current = user.id;
    setProfile({
      orgName: user.businessName || user.name || "",
      email: user.email,
      phone: user.phone || "",
      description: user.description || "",
      website: user.website || "",
      instagram: user.instagram || "",
    });
    setLogo(user.logoUrl || "");
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    listOrganizerEvents(user.id)
      .then((list) => {
        if (!cancelled) setPortfolio(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    const result = await updateProfile({
      businessName: profile.orgName.trim(),
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

  const initials = (profile.orgName || "EO")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="animate-fade-in max-w-2xl relative" id="organizer-profile">
      <input
        type="file"
        ref={photoInputRef}
        className="hidden"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !user) return;
          try {
            const url = await uploadImage(user.id, file, "logo", 400);
            const result = await updateProfile({ logoUrl: url });
            if (!result.success) throw new Error(result.message);
            setLogo(url);
            setPhotoToast({ text: "Foto profil organisasi berhasil diperbarui.", tone: "ok" });
          } catch (err) {
            setPhotoToast({ text: errorMessage(err, "Foto gagal diunggah."), tone: "error" });
          }
          setTimeout(() => setPhotoToast(null), 3500);
        }}
      />
      {photoToast && (
        <div className={`page-toast ${photoToast.tone === "error" ? "page-toast--error" : ""}`} role="status">
          <Icon name={photoToast.tone === "error" ? "bell" : "check"} size={16} />
          <span>{photoToast.text}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Organisasi</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi perusahaan penyelenggara event dan kontak resmi</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-foreground text-2xl font-bold shadow-md overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo organisasi" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{profile.orgName}</h2>
            <p className="text-sm text-muted-foreground">Event Organizer</p>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="btn btn-secondary btn-sm mt-2"
              id="change-org-photo"
            >
              Ganti Foto
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
          <label className="block text-sm font-medium mb-2">Nama Organisasi / PT Penyelenggara</label>
          <input
            type="text"
            required
            className="input-base"
            value={profile.orgName}
            onChange={(e) => setProfile({ ...profile, orgName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Akun</label>
            <input
              type="email"
              className="input-base"
              value={profile.email}
              readOnly
              aria-describedby="org-email-note"
            />
            <p id="org-email-note" className="text-xs text-muted-foreground mt-1">Email dipakai untuk masuk dan tidak bisa diubah di sini.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telepon / WhatsApp Panitia</label>
            <input
              type="tel"
              className="input-base"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Deskripsi Organisasi</label>
          <textarea
            className="input-base min-h-[100px] resize-y"
            value={profile.description}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={4}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Website Resmi</label>
            <input
              type="url"
              className="input-base"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Instagram Organisasi</label>
            <input
              type="text"
              className="input-base"
              value={profile.instagram}
              onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
            />
          </div>
        </div>
        {saveError && <p className="text-sm text-error" role="alert">{saveError}</p>}
        <button type="submit" className="btn btn-primary" id="save-org-profile" disabled={saving}>
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}
        </button>
      </form>

      {/* Event Portfolio */}
      <div className="card-base p-6 mt-6">
        <h2 className="font-semibold mb-4">Portofolio &amp; Jejak Rekam Event</h2>
        {portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada event. Event yang kamu buat akan tampil di sini.</p>
        ) : (
        <div className="space-y-3">
          {portfolio.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-foreground/[0.02]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.date} • {event.boothsFilled}/{event.boothsTotal} booth terisi</p>
              </div>
              <span className={`badge text-[10px] ${event.status === "published" ? "badge-primary" : "bg-foreground/5 text-muted-foreground"}`}>
                {event.status === "published" ? "Terbit" : "Draft"}
              </span>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizerProfilePage() {
  return (
    <FreshOnNavigate>
      <OrganizerProfilePageContent />
    </FreshOnNavigate>
  );
}
