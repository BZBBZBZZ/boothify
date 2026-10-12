"use client";

import { useState, useEffect } from "react";

const DEFAULT_PROFILE = {
  orgName: "PT. Green Events Indonesia",
  email: "admin@greenevents.id",
  phone: "+62 812 3456 7890",
  description: "Penyelenggara event terkemuka yang berfokus pada sustainability dan green lifestyle. Berpengalaman mengelola lebih dari 50 event nasional.",
  website: "https://greenevents.id",
  instagram: "@greenevents.id",
};

export default function OrganizerProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boothify_org_profile");
      if (stored) setProfile(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem("boothify_org_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in max-w-2xl" id="organizer-profile">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profil Organisasi</h1>
        <p className="text-sm text-muted-foreground">Kelola informasi organisasi penyelenggara event</p>
      </div>

      {/* Avatar */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-bold">
            GE
          </div>
          <div>
            <h2 className="font-semibold">{profile.orgName}</h2>
            <p className="text-sm text-muted-foreground">Verified Organizer ✓</p>
            <button className="btn btn-secondary btn-sm mt-2">Ganti Foto</button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="card-base p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Nama Organisasi</label>
          <input type="text" className="input-base" value={profile.orgName} onChange={(e) => setProfile({ ...profile, orgName: e.target.value })} />
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
          <label className="block text-sm font-medium mb-2">Deskripsi</label>
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
        <button type="button" onClick={handleSave} className="btn btn-primary" id="save-org-profile">{saved ? "✓ Tersimpan!" : "Simpan Perubahan"}</button>
      </form>

      {/* Event Portfolio */}
      <div className="card-base p-6 mt-6">
        <h2 className="font-semibold mb-4">Portofolio Event</h2>
        <div className="space-y-3">
          {[
            { name: "Green Fashion Expo 2025", date: "Nov 2025", attendees: "15,000+", status: "Selesai" },
            { name: "Sustainable Living Fair 2025", date: "Jul 2025", attendees: "8,500+", status: "Selesai" },
            { name: "Eco Market Jakarta 2024", date: "Des 2024", attendees: "12,000+", status: "Selesai" },
          ].map((event) => (
            <div key={event.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.name}</p>
                <p className="text-xs text-muted-foreground">{event.date} • {event.attendees} pengunjung</p>
              </div>
              <span className="badge badge-primary text-[10px]">{event.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
