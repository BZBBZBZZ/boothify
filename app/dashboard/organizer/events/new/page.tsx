"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { EVENT_CATEGORY_OPTIONS, getEventCategoryValue } from "@/app/lib/event-categories";
import { ASIA_LOCATIONS } from "@/app/lib/asia-locations";

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const organizerEmail = user?.email || "demo-organizer@boothify.id";
  const organizerName = user?.businessName || user?.name || "PT. Event Kreasi Nusantara";

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUploaded, setBannerUploaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date_start: "",
    date_end: "",
    time_start: "10:00",
    time_end: "21:00",
    location: "",
    country: "",
    province: "",
    city: "",
    address: "",
    description: "",
    theme: "",
    guidelines: "",
    categories: [] as string[],
  });

  const handleSaveDraft = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const draftEvent = {
        id: String(Date.now()),
        title: formData.name || "Draft Event Baru",
        date: formData.date_start ? `${formData.date_start} – ${formData.date_end || formData.date_start}` : "Belum ditentukan",
        status: "draft",
        boothsFilled: 0,
        boothsTotal: 40,
        location: formData.location || "Belum ditentukan",
        country: formData.country,
        province: formData.province,
        city: formData.city,
        categories: formData.categories,
        categoryKeys: formData.categories.filter((category) => category !== "all").map(getEventCategoryValue),
        description: formData.description,
        organizer: organizerName,
        organizerEmail: organizerEmail,
      };
      stored.unshift(draftEvent);
      localStorage.setItem("boothify_events", JSON.stringify(stored));
    } catch {
      // ignore
    }
    router.push("/dashboard/organizer");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventId = String(Date.now());
    try {
      const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
      const categoryFromTheme = formData.categories.filter((category) => category !== "all").join(", ") || "Umum";
      const categoryKeys = formData.categories.filter((category) => category !== "all").map(getEventCategoryValue);

      const newEvent = {
        id: eventId,
        title: formData.name || "Event Baru",
        date: formData.date_start ? `${formData.date_start} s/d ${formData.date_end || formData.date_start}` : "Nov 2026",
        status: "active",
        category: categoryFromTheme,
          categories: formData.categories,
          categoryKeys,
        boothsFilled: 0,
        boothsTotal: 30,
        location: formData.location || "Venue Acara",
        country: formData.country,
        province: formData.province,
        city: formData.city,
        address: formData.address || "",
        description: formData.description || "Pameran & expo booth interaktif.",
        organizer: organizerName,
        organizerEmail: organizerEmail,
        priceRange: "Rp 2.000.000 – Rp 4.500.000",
        image: "🎪",
        theme: formData.theme,
        guidelines: formData.guidelines,
      };
      stored.unshift(newEvent);
      localStorage.setItem("boothify_events", JSON.stringify(stored));
      router.push(`/dashboard/organizer/events/${eventId}/floor-plan`);
    } catch {
      router.push(`/dashboard/organizer/events/${eventId}/floor-plan`);
    }
  };

  const update = (key: string, value: string | string[]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="animate-fade-in" id="create-event-page">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Buat Event Baru</h1>
        <p className="text-sm text-muted-foreground">Isi detail acara untuk mulai menerima pendaftaran booth</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="card-base p-6 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Detail Event
          </h2>

          <div>
            <label htmlFor="event-name" className="block text-sm font-medium mb-2">Nama Event *</label>
            <input id="event-name" type="text" className="input-base" placeholder="Green Fashion Expo 2026" value={formData.name} onChange={(e) => update("name", e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-date-start" className="block text-sm font-medium mb-2">Tanggal Mulai *</label>
              <input id="event-date-start" type="date" className="input-base" value={formData.date_start} onChange={(e) => update("date_start", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="event-date-end" className="block text-sm font-medium mb-2">Tanggal Selesai *</label>
              <input id="event-date-end" type="date" className="input-base" value={formData.date_end} onChange={(e) => update("date_end", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-time-start" className="block text-sm font-medium mb-2">Waktu Buka</label>
              <input id="event-time-start" type="time" className="input-base" value={formData.time_start} onChange={(e) => update("time_start", e.target.value)} />
            </div>
            <div>
              <label htmlFor="event-time-end" className="block text-sm font-medium mb-2">Waktu Tutup</label>
              <input id="event-time-end" type="time" className="input-base" value={formData.time_end} onChange={(e) => update("time_end", e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor="event-location" className="block text-sm font-medium mb-2">Nama Venue *</label>
            <input id="event-location" type="text" className="input-base" placeholder="Jakarta Convention Center, Hall A" value={formData.location} onChange={(e) => update("location", e.target.value)} required />
          </div>

          <fieldset>
            <legend className="block text-sm font-medium mb-2">Kategori Event *</legend>
            <label className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5 cursor-pointer mb-3">
              <input type="checkbox" checked={formData.categories.includes("all")} onChange={(e) => update("categories", e.target.checked ? ["all", ...EVENT_CATEGORY_OPTIONS.map((category) => category.label)] : [])} />
              <span className="text-sm font-semibold">All (semua kategori)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EVENT_CATEGORY_OPTIONS.map((category) => (
                <label key={category.value} className="flex items-start gap-2 p-3 rounded-xl border border-border hover:border-primary/40 cursor-pointer text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes("all") || formData.categories.includes(category.label)}
                    onChange={(e) => setFormData((prev) => {
                      const next = e.target.checked ? [...prev.categories.filter((item) => item !== "all"), category.label] : prev.categories.filter((item) => item !== category.label && item !== "all");
                      return { ...prev, categories: next };
                    })}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="block text-sm font-medium">Lokasi Event di Asia *</legend>
            <p className="text-xs text-muted-foreground -mt-2">Pilih negara, provinsi atau wilayah, lalu kota. Pilihan berikutnya akan menyesuaikan lokasi sebelumnya.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="event-country" className="block text-xs font-medium mb-2">Negara</label>
                <select
                  id="event-country"
                  className="input-base"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value, province: "", city: "" }))}
                  required
                >
                  <option value="">Pilih negara</option>
                  {Object.keys(ASIA_LOCATIONS).map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="event-province" className="block text-xs font-medium mb-2">Provinsi / Wilayah</label>
                <select
                  id="event-province"
                  className="input-base"
                  value={formData.province}
                  onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value, city: "" }))}
                  disabled={!formData.country}
                  required
                >
                  <option value="">Pilih provinsi</option>
                  {Object.keys(ASIA_LOCATIONS[formData.country] || {}).map((province) => <option key={province} value={province}>{province}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="event-city" className="block text-xs font-medium mb-2">Kota</label>
                <select
                  id="event-city"
                  className="input-base"
                  value={formData.city}
                  onChange={(e) => update("city", e.target.value)}
                  disabled={!formData.province}
                  required
                >
                  <option value="">Pilih kota</option>
                  {(ASIA_LOCATIONS[formData.country]?.[formData.province] || []).map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="event-address" className="block text-sm font-medium mb-2">Alamat Lengkap</label>
            <input id="event-address" type="text" className="input-base" placeholder="Jl. Jend. Gatot Subroto, Senayan, Jakarta" value={formData.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div>
            <label htmlFor="event-desc" className="block text-sm font-medium mb-2">Deskripsi Event</label>
            <textarea id="event-desc" className="input-base min-h-[120px] resize-y" placeholder="Ceritakan tentang event kamu, tema, dan keunikannya..." value={formData.description} onChange={(e) => update("description", e.target.value)} rows={5} />
          </div>

          <div>
            <label htmlFor="event-theme" className="block text-sm font-medium mb-2">Tema / Campaign</label>
            <input id="event-theme" type="text" className="input-base" placeholder="Sustainable Fashion, Green Living, dll." value={formData.theme} onChange={(e) => update("theme", e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Gunakan <a href="/dashboard/organizer/events/1/ai-campaign" className="text-primary-light underline">AI Campaign Generator</a> untuk mendapatkan rekomendasi tema
            </p>
          </div>

          <div>
            <label htmlFor="event-guidelines" className="block text-sm font-medium mb-2">Panduan untuk Tenant</label>
            <textarea id="event-guidelines" className="input-base min-h-[80px] resize-y" placeholder="Aturan dan panduan khusus untuk tenant yang berpartisipasi..." value={formData.guidelines} onChange={(e) => update("guidelines", e.target.value)} rows={3} />
          </div>
        </div>

        {/* Banner upload */}
        <div className="card-base p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            Banner Event
          </h2>
          <input
            type="file"
            ref={bannerInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setBannerUploaded(true);
              }
            }}
          />
          <div
            onClick={() => bannerInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition cursor-pointer"
          >
            {bannerUploaded ? (
              <div className="text-primary-light">
                <svg className="mx-auto mb-2 text-primary" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-sm font-semibold">✓ Banner Event Berhasil Diunggah!</p>
                <p className="text-xs text-muted-foreground mt-1">Klik untuk mengganti banner</p>
              </div>
            ) : (
              <>
                <svg className="mx-auto mb-3 text-muted-foreground" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="text-sm text-muted-foreground">Drag &amp; drop atau <span className="text-primary-light font-medium">klik untuk upload banner</span></p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP. Ukuran ideal 1200×400px</p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary btn-lg" id="create-event-submit">
            Lanjut ke Floor Plan Builder →
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn btn-secondary btn-lg"
            id="save-event-draft"
          >
            Simpan sebagai Draft
          </button>
        </div>
      </form>
    </div>
  );
}
