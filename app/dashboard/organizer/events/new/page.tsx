"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthContext";
import { EVENT_CATEGORY_OPTIONS } from "@/app/lib/event-categories";
import { createEvent, errorMessage } from "@/app/lib/db";
import { uploadImage } from "@/app/lib/file-upload";
import { setActiveOrganizerEventId } from "@/app/lib/event-defaults";
import { ASIA_LOCATIONS } from "@/app/lib/asia-locations";
import FreshOnNavigate from "../../../../components/FreshOnNavigate";
import { FacilityPicker, type Facilities } from "../../../../components/BoothFacilities";
import { Field, Notice, PageHeader, Stepper } from "../../../../components/ui";

/* Creating an event is split in steps so each screen asks for one kind of information.
   The last step (the booth floor plan) lives on its own page. */
const STEPS = ["Info event", "Waktu & lokasi", "Fasilitas & aturan", "Denah booth"];

type Step = 0 | 1 | 2;

function CreateEventPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const organizerEmail = user?.email || "";
  const organizerName = user?.businessName || user?.name || "";

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [facilities, setFacilities] = useState<Facilities>({ included: [], excluded: [] });
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

  const [formError, setFormError] = useState("");

  const realCategories = formData.categories.filter((category) => category !== "all");

  // A new event stays a private draft until the organizer publishes it from the floor plan builder
  const saveDraft = async (): Promise<string | null> => {
    try {
      const id = await createEvent({
        title: formData.name.trim(),
        date: formData.date_start ? `${formData.date_start} s/d ${formData.date_end || formData.date_start}` : "",
        time: formData.time_start && formData.time_end ? `${formData.time_start} - ${formData.time_end}` : "",
        location: formData.location.trim(),
        country: formData.country || "Indonesia",
        province: formData.province,
        city: formData.city,
        address: formData.address.trim(),
        category: realCategories.join(", ") || "Umum",
        categories: realCategories,
        description: formData.description.trim(),
        theme: formData.theme.trim(),
        guidelines: formData.guidelines.trim(),
        facilitiesIncluded: facilities.included,
        facilitiesExcluded: facilities.excluded,
        image: bannerUrl,
        organizer: organizerName,
        organizerEmail,
      });
      setActiveOrganizerEventId(id);
      return id;
    } catch (err) {
      setFormError(errorMessage(err, "Event gagal disimpan."));
      return null;
    }
  };

  /** Checks the fields of one step; returns an error message or "". */
  const validate = (which: Step): string => {
    if (which === 0) {
      if (!formData.name.trim()) return "Isi nama event.";
      if (realCategories.length === 0) return "Pilih minimal satu kategori event.";
    }
    if (which === 1) {
      if (!formData.date_start || !formData.date_end) return "Isi tanggal mulai dan tanggal selesai.";
      if (formData.date_end < formData.date_start) return "Tanggal selesai tidak boleh sebelum tanggal mulai.";
      if (!formData.location.trim()) return "Isi nama venue.";
      if (!formData.country || !formData.province || !formData.city) return "Pilih negara, provinsi, dan kota.";
    }
    return "";
  };

  const handleSaveDraft = async () => {
    if (submitting || bannerUploading) return;
    setFormError("");
    if (!formData.name.trim()) {
      setStep(0);
      setFormError("Isi nama event dulu sebelum menyimpan draft.");
      return;
    }
    setSubmitting(true);
    const id = await saveDraft();
    if (id) router.push("/dashboard/organizer");
    else setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || bannerUploading) return;
    setFormError("");
    const problem = validate(step);
    if (problem) {
      setFormError(problem);
      return;
    }
    if (step < 2) {
      setStep((s) => (s + 1) as Step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Final check of every step before saving
    for (const s of [0, 1] as Step[]) {
      const p = validate(s);
      if (p) {
        setStep(s);
        setFormError(p);
        return;
      }
    }
    setSubmitting(true);
    const id = await saveDraft();
    if (id) router.push(`/dashboard/organizer/events/${id}/floor-plan`);
    else setSubmitting(false);
  };

  const handleBanner = async (file: File) => {
    if (!user) return;
    setFormError("");
    setBannerUploading(true);
    try {
      setBannerUrl(await uploadImage(user.id, file, "banner", 1600));
    } catch (err) {
      setFormError(errorMessage(err, "Banner gagal diunggah."));
    } finally {
      setBannerUploading(false);
    }
  };

  const update = (key: string, value: string | string[]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="animate-fade-in max-w-3xl" id="create-event-page">
      <PageHeader
        title="Buat event baru"
        description="Event disimpan sebagai draft dan belum tampil di publik sampai kamu menerbitkannya dari halaman denah booth."
      />

      <Stepper steps={STEPS} current={step} />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* STEP 1: what the event is */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <section className="card-base p-6 space-y-5">
              <div>
                <h2 className="section-title">Info event</h2>
                <p className="section-desc">Nama, kategori, dan deskripsi ini tampil di halaman publik event.</p>
              </div>

              <Field label="Nama event" required id="event-name">
                {(id) => <input id={id} type="text" className="input-base" placeholder="Contoh: Green Fashion Expo 2026" value={formData.name} onChange={(e) => update("name", e.target.value)} required />}
              </Field>

              <fieldset>
                <legend className="field-label">Kategori event <span className="text-error" aria-hidden="true">*</span></legend>
                <p className="field-hint mt-0 mb-3">Tenant dengan kategori yang sama akan direkomendasikan event ini.</p>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer mb-2 font-medium text-sm">
                  <input type="checkbox" checked={formData.categories.includes("all")} onChange={(e) => update("categories", e.target.checked ? ["all", ...EVENT_CATEGORY_OPTIONS.map((category) => category.label)] : [])} />
                  Semua kategori
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EVENT_CATEGORY_OPTIONS.map((category) => (
                    <label key={category.value} className="flex items-start gap-2 p-3 rounded-lg border border-border hover:border-foreground cursor-pointer text-sm leading-snug">
                      <input
                        type="checkbox"
                        className="mt-0.5"
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

              <Field label="Deskripsi event" optional id="event-desc" hint="Ceritakan konsep acara, target pengunjung, dan keunikannya.">
                {(id) => <textarea id={id} className="input-base min-h-[120px] resize-y" value={formData.description} onChange={(e) => update("description", e.target.value)} rows={5} />}
              </Field>

              <Field label="Tema / campaign" optional id="event-theme" hint="Setelah event dibuat, buka Ide Campaign di menu samping untuk rekomendasi tema.">
                {(id) => <input id={id} type="text" className="input-base" placeholder="Contoh: Sustainable Fashion" value={formData.theme} onChange={(e) => update("theme", e.target.value)} />}
              </Field>
            </section>

            <section className="card-base p-6">
              <h2 className="section-title">Banner event <span className="field-tag">Opsional</span></h2>
              <p className="section-desc mb-4">Gambar utama di halaman event. Ukuran ideal 1200×400 px (JPG, PNG, atau WebP).</p>
              <input
                type="file"
                ref={bannerInputRef}
                className="visually-hidden"
                accept="image/*"
                id="event-banner"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleBanner(file);
                }}
              />
              <button type="button" onClick={() => bannerInputRef.current?.click()} className={`upload-drop w-full ${bannerUploading ? "is-busy" : ""}`}>
                {bannerUploading ? (
                  <span className="text-sm">Mengunggah banner...</span>
                ) : bannerUrl ? (
                  <>
                    <img src={bannerUrl} alt="Pratinjau banner event" className="w-full max-h-48 object-cover rounded-lg" />
                    <span className="text-xs text-muted-foreground">Klik untuk mengganti banner</span>
                  </>
                ) : (
                  <>
                    <svg className="text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    <span className="text-sm font-medium">Klik untuk mengunggah banner</span>
                  </>
                )}
              </button>
            </section>
          </div>
        )}

        {/* STEP 2: when and where */}
        {step === 1 && (
          <section className="card-base p-6 space-y-5 animate-fade-in">
            <div>
              <h2 className="section-title">Waktu & lokasi</h2>
              <p className="section-desc">Tenant memakai tanggal dan lokasi ini untuk memutuskan ikut atau tidak.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tanggal mulai" required id="event-date-start">
                {(id) => <input id={id} type="date" className="input-base" value={formData.date_start} onChange={(e) => update("date_start", e.target.value)} required />}
              </Field>
              <Field label="Tanggal selesai" required id="event-date-end">
                {(id) => <input id={id} type="date" className="input-base" min={formData.date_start || undefined} value={formData.date_end} onChange={(e) => update("date_end", e.target.value)} required />}
              </Field>
              <Field label="Jam buka" id="event-time-start">
                {(id) => <input id={id} type="time" className="input-base" value={formData.time_start} onChange={(e) => update("time_start", e.target.value)} />}
              </Field>
              <Field label="Jam tutup" id="event-time-end">
                {(id) => <input id={id} type="time" className="input-base" value={formData.time_end} onChange={(e) => update("time_end", e.target.value)} />}
              </Field>
            </div>

            <Field label="Nama venue" required id="event-location">
              {(id) => <input id={id} type="text" className="input-base" placeholder="Contoh: Jakarta Convention Center, Hall A" value={formData.location} onChange={(e) => update("location", e.target.value)} required />}
            </Field>

            <fieldset>
              <legend className="field-label">Wilayah <span className="text-error" aria-hidden="true">*</span></legend>
              <p className="field-hint mt-0 mb-3">Pilih negara dulu, lalu provinsi, lalu kota.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Negara" id="event-country">
                  {(id) => (
                    <select id={id} className="input-base" value={formData.country} onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value, province: "", city: "" }))} required>
                      <option value="">Pilih negara</option>
                      {Object.keys(ASIA_LOCATIONS).map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Provinsi / wilayah" id="event-province">
                  {(id) => (
                    <select id={id} className="input-base" value={formData.province} onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value, city: "" }))} disabled={!formData.country} required>
                      <option value="">Pilih provinsi</option>
                      {Object.keys(ASIA_LOCATIONS[formData.country] || {}).map((province) => <option key={province} value={province}>{province}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Kota" id="event-city">
                  {(id) => (
                    <select id={id} className="input-base" value={formData.city} onChange={(e) => update("city", e.target.value)} disabled={!formData.province} required>
                      <option value="">Pilih kota</option>
                      {(ASIA_LOCATIONS[formData.country]?.[formData.province] || []).map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  )}
                </Field>
              </div>
            </fieldset>

            <Field label="Alamat lengkap" optional id="event-address">
              {(id) => <input id={id} type="text" className="input-base" placeholder="Contoh: Jl. Jend. Gatot Subroto, Senayan, Jakarta" value={formData.address} onChange={(e) => update("address", e.target.value)} />}
            </Field>
          </section>
        )}

        {/* STEP 3: what a booth includes, and the rules */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <section className="card-base p-6">
              <h2 className="section-title">Fasilitas booth</h2>
              <p className="section-desc mb-5">
                Tandai fasilitas yang sudah termasuk harga sewa dan yang harus dibawa sendiri oleh tenant. Ini tampil di halaman event sebelum tenant menyewa.
              </p>
              <FacilityPicker value={facilities} onChange={setFacilities} />
            </section>

            <section className="card-base p-6">
              <Field label="Panduan untuk tenant" optional id="event-guidelines" hint="Aturan khusus, misalnya jam loading barang, larangan, atau dress code.">
                {(id) => <textarea id={id} className="input-base min-h-[100px] resize-y" placeholder="Contoh: Loading barang H-1 pukul 15.00–20.00. Dilarang memakai kompor gas." value={formData.guidelines} onChange={(e) => update("guidelines", e.target.value)} rows={4} />}
              </Field>
            </section>
          </div>
        )}

        {formError && <Notice tone="error">{formError}</Notice>}

        <div className="flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => { setFormError(""); setStep((s) => (s - 1) as Step); }}>
              Kembali
            </button>
          )}
          <button type="submit" className="btn btn-primary btn-lg" id="create-event-submit" disabled={submitting || bannerUploading}>
            {submitting ? "Menyimpan..." : step < 2 ? `Lanjut: ${STEPS[step + 1]}` : "Simpan & lanjut ke denah booth"}
          </button>
          <button type="button" onClick={handleSaveDraft} className="btn btn-secondary btn-lg ml-auto" id="save-event-draft" disabled={submitting || bannerUploading}>
            Simpan sebagai draft
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <FreshOnNavigate>
      <CreateEventPageContent />
    </FreshOnNavigate>
  );
}
