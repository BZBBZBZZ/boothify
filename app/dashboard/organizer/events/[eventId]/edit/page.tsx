"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../components/AuthContext";
import type { EventDetail } from "../../../../../lib/event-defaults";
import { getEvent, updateEvent, errorMessage } from "@/app/lib/db";
import FreshOnNavigate from "../../../../../components/FreshOnNavigate";
import { FacilityPicker, type Facilities } from "../../../../../components/BoothFacilities";
import { Field, Notice, PageHeader, TabPanel, Tabs } from "../../../../../components/ui";

type TabKey = "info" | "place" | "facilities";

type TextField = { key: keyof EventDetail; label: string; hint?: string; placeholder?: string; multiline?: boolean; required?: boolean };

/* Each tab holds one kind of information, so the form is never one long scroll. */
const TAB_FIELDS: Record<Exclude<TabKey, "facilities">, TextField[]> = {
  info: [
    { key: "title", label: "Nama event", required: true },
    { key: "description", label: "Deskripsi event", multiline: true, hint: "Tampil di tab Informasi Event pada halaman publik." },
    { key: "theme", label: "Tema / campaign", placeholder: "Contoh: Sustainable Fashion" },
  ],
  place: [
    { key: "date", label: "Tanggal", hint: "Format: 2026-12-20 s/d 2026-12-22", placeholder: "2026-12-20 s/d 2026-12-22" },
    { key: "time", label: "Jam operasional", hint: "Format: 10:00 - 21:00", placeholder: "10:00 - 21:00" },
    { key: "location", label: "Nama venue", placeholder: "Contoh: Jakarta Convention Center, Hall A" },
    { key: "address", label: "Alamat lengkap" },
  ],
};

const sameList = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((x, i) => x === b[i]);

function EditEventPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");
  const { user, isLoading } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [savedFacilities, setSavedFacilities] = useState<Facilities>({ included: [], excluded: [] });
  const [status, setStatus] = useState<string>("published");
  const [tab, setTab] = useState<TabKey>("info");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading || !user) return;
    let cancelled = false;
    getEvent(eventId)
      .then((loaded) => {
        if (cancelled) return;
        // Only the organizer who owns the event may edit it
        if (!loaded || loaded.organizerId !== user.id) {
          router.replace(loaded ? `/events/${eventId}` : "/dashboard/organizer");
          return;
        }
        setStatus(loaded.status || "published");
        setSavedFacilities({ included: loaded.facilitiesIncluded || [], excluded: loaded.facilitiesExcluded || [] });
        setEvent(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Event gagal dimuat."));
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, isLoading, router, user]);

  const update = (key: keyof EventDetail, value: unknown) =>
    setEvent((current) => (current ? { ...current, [key]: value } : current));

  const facilities: Facilities = { included: event?.facilitiesIncluded || [], excluded: event?.facilitiesExcluded || [] };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || saving) return;
    if (!event.title.trim()) {
      setTab("info");
      setError("Nama event wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    // Facilities are only written when they changed, so older databases keep working
    const facilitiesChanged = !sameList(facilities.included, savedFacilities.included) || !sameList(facilities.excluded, savedFacilities.excluded);
    try {
      await updateEvent(eventId, {
        title: event.title.trim(),
        date: event.date,
        time: event.time || "",
        location: event.location,
        address: event.address || "",
        description: event.description,
        theme: event.theme || "",
        guidelines: event.guidelines || "",
        ...(facilitiesChanged ? { facilitiesIncluded: facilities.included, facilitiesExcluded: facilities.excluded } : {}),
      });
      if (facilitiesChanged) setSavedFacilities(facilities);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(errorMessage(err, "Event gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    return error
      ? <Notice tone="error" className="my-16">{error}</Notice>
      : <p className="py-16 text-center text-sm text-muted-foreground">Memuat event...</p>;
  }

  const renderField = ({ key, label, hint, placeholder, multiline, required }: TextField) => (
    <Field key={key} label={label} hint={hint} required={required} id={`edit-${key}`}>
      {(id) =>
        multiline ? (
          <textarea id={id} className="input-base min-h-32 resize-y" placeholder={placeholder} value={String(event[key] ?? "")} onChange={(e) => update(key, e.target.value)} />
        ) : (
          <input id={id} className="input-base" placeholder={placeholder} value={String(event[key] ?? "")} onChange={(e) => update(key, e.target.value)} required={required} />
        )
      }
    </Field>
  );

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Edit informasi event"
        description={
          status === "draft"
            ? "Event ini masih draft dan belum tampil di publik. Terbitkan dari halaman denah booth."
            : "Perubahan langsung tampil di halaman publik event setelah disimpan."
        }
        actions={
          status === "draft" ? (
            <button type="button" className="btn btn-secondary" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/floor-plan`)}>
              Buka denah booth
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => router.push(`/events/${eventId}`)}>
              Lihat halaman event
            </button>
          )
        }
      />

      <Tabs<TabKey>
        label="Bagian informasi event"
        idPrefix="edit-event"
        active={tab}
        onChange={setTab}
        items={[
          { key: "info", label: "Info event" },
          { key: "place", label: "Waktu & lokasi" },
          { key: "facilities", label: "Fasilitas & aturan", count: facilities.included.length + facilities.excluded.length },
        ]}
      />

      <form onSubmit={save} className="space-y-6">
        {tab !== "facilities" ? (
          <TabPanel idPrefix="edit-event" tabKey={tab} className="card-base p-6 space-y-5">
            {TAB_FIELDS[tab].map(renderField)}
          </TabPanel>
        ) : (
          <TabPanel idPrefix="edit-event" tabKey="facilities" className="space-y-6">
            <section className="card-base p-6">
              <h2 className="section-title">Fasilitas booth</h2>
              <p className="section-desc mb-5">Tampil di halaman event, supaya tenant tahu apa yang perlu dibawa sendiri.</p>
              <FacilityPicker
                value={facilities}
                onChange={(next) => setEvent((current) => (current ? { ...current, facilitiesIncluded: next.included, facilitiesExcluded: next.excluded } : current))}
              />
            </section>
            <section className="card-base p-6">
              {renderField({ key: "guidelines", label: "Panduan untuk tenant", multiline: true, hint: "Aturan khusus, misalnya jam loading barang, larangan, atau dress code." })}
            </section>
          </TabPanel>
        )}

        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice tone="ok">Perubahan tersimpan.</Notice>}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
          <p className="field-hint self-center m-0">Tombol ini menyimpan isi semua tab sekaligus.</p>
        </div>
      </form>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <FreshOnNavigate>
      <EditEventPageContent />
    </FreshOnNavigate>
  );
}
