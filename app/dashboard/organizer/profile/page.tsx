"use client";

import { useState, useEffect, useRef } from "react";
import { resetDemoWorkspace, useAuth } from "@/app/components/AuthContext";

export default function OrganizerProfilePage() {
  const { user, updateProfile } = useAuth();
  const email = user?.email || "demo-organizer@boothify.id";
  const isDemoOrg = email === "demo-organizer@boothify.id" || email === "organizer@boothify.id";

  const [profile, setProfile] = useState({
    orgName: user?.businessName || (isDemoOrg ? "PT. Event Kreasi Nusantara" : user?.name || "Organisasi Saya"),
    email: user?.email || "demo-organizer@boothify.id",
    phone: user?.phone || "+62 812 3456 7890",
    description: user?.description || (isDemoOrg
      ? "Penyelenggara expo dan festival pameran industri kreatif profesional berstandar nasional dan internasional di Indonesia."
      : "Penyelenggara event pameran, expo dan festival terpercaya."),
    website: user?.website || (isDemoOrg ? "https://eventkreasi.id" : "https://boothify.id"),
    instagram: user?.instagram || (isDemoOrg ? "@eventkreasi.id" : "@organizer"),
  });

  const [saved, setSaved] = useState(false);
  const [photoToast, setPhotoToast] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`boothify_org_profile_${email}`);
      if (stored) {
        setProfile(JSON.parse(stored));
      } else if (user) {
        setProfile({
          orgName: user.businessName || (isDemoOrg ? "PT. Event Kreasi Nusantara" : user.name || "Organisasi Saya"),
          email: user.email,
          phone: user.phone || "+62 812 3456 7890",
          description: user.description || (isDemoOrg
            ? "Penyelenggara expo dan festival pameran industri kreatif profesional berstandar nasional di Indonesia."
            : "Penyelenggara event pameran, expo dan festival terpercaya."),
          website: user.website || (isDemoOrg ? "https://eventkreasi.id" : "https://boothify.id"),
          instagram: user.instagram || (isDemoOrg ? "@eventkreasi.id" : "@organizer"),
        });
      }
    } catch {
      // ignore
    }
  }, [user, email, isDemoOrg]);

  const handleSave = () => {
    try {
      localStorage.setItem(`boothify_org_profile_${email}`, JSON.stringify(profile));
      if (isDemoOrg) {
        localStorage.setItem("boothify_org_profile", JSON.stringify(profile));
      }
      updateProfile({
        businessName: profile.orgName,
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
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setPhotoToast(true);
            setTimeout(() => setPhotoToast(false), 3000);
          }
        }}
      />
      {photoToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 shadow-xl flex items-center gap-3 animate-fade-in text-sm font-medium text-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-xs font-bold">✓</div>
          Foto profil organisasi berhasil diperbarui!
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Organisasi</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi perusahaan penyelenggara event dan kontak resmi</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center text-foreground text-2xl font-bold shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{profile.orgName}</h2>
            <p className="text-sm text-emerald-400 font-medium">Verified Event Organizer ✓</p>
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
            <label className="block text-sm font-medium mb-2">Email Resmi</label>
            <input
              type="email"
              className="input-base"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
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
        <button type="submit" className="btn btn-primary" id="save-org-profile">
          {saved ? "✓ Tersimpan!" : "Simpan Perubahan"}
        </button>
      </form>

      {/* Event Portfolio */}
      <div className="card-base p-6 mt-6">
        <h2 className="font-semibold mb-4">Portofolio &amp; Jejak Rekam Event</h2>
        <div className="space-y-3">
          {[
            { name: "Green Fashion Expo 2026", date: "15–17 Nov 2026", attendees: "14 booth", status: "Aktif" },
            { name: "Indonesia Food Festival 2026", date: "22–24 Nov 2026", attendees: "10 booth", status: "Aktif" },
            { name: "EduTech Innovation Fair 2026", date: "1–3 Des 2026", attendees: "8 booth", status: "Aktif" },
          ].map((event) => (
            <div key={event.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.name}</p>
                <p className="text-xs text-muted-foreground">{event.date} • {event.attendees} tersedia</p>
              </div>
              <span className="badge badge-primary text-[10px]">{event.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Demo Data */}
      <div className="card-base p-6 mt-6 border border-amber-500/20 bg-amber-500/[0.02]">
        <h2 className="font-semibold text-sm mb-1 text-foreground flex items-center gap-2">
          <span>🔄</span> Reset Data Uji Coba
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Ingin mengulang pengujian dari awal? Menekan tombol ini akan menghapus semua data input pengujian (event baru, perubahan katalog, riwayat pesanan buatan Anda) dan mengembalikan seluruh akun &amp; data ke kondisi demo awal bawaan.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset semua input pengujian dan kembalikan ke data demo awal? Semua akun demo (Organizer, Tenant, Pengunjung) dan event bawaan akan tetap ada.")) {
              resetDemoWorkspace(true);
              window.location.reload();
            }
          }}
          className="btn btn-sm text-xs bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 font-medium cursor-pointer"
          id="btn-reset-demo-org"
        >
          Reset ke Data Demo Awal
        </button>
      </div>
    </div>
  );
}
