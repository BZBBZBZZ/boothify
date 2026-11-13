"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../components/AuthContext";
import type { EventDetail } from "../../../../../lib/event-defaults";
import { getEvent, updateEvent, errorMessage } from "@/app/lib/db";
import FreshOnNavigate from "../../../../../components/FreshOnNavigate";

const FIELDS: Array<{ key: keyof EventDetail; label: string; multiline?: boolean }> = [
  { key: "title", label: "Nama Event" },
  { key: "date", label: "Tanggal" },
  { key: "time", label: "Waktu" },
  { key: "location", label: "Nama Venue" },
  { key: "address", label: "Alamat Lengkap" },
  { key: "description", label: "Deskripsi", multiline: true },
  { key: "theme", label: "Tema / Campaign" },
  { key: "guidelines", label: "Panduan untuk Tenant", multiline: true },
];

function EditEventPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");
  const { user, isLoading } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [status, setStatus] = useState<string>("published");
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
        setEvent(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Event gagal dimuat."));
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, isLoading, router, user]);

  const update = (key: keyof EventDetail, value: string) =>
    setEvent((current) => (current ? { ...current, [key]: value } : current));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || saving) return;
    if (!event.title.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
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
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(errorMessage(err, "Event gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    return error
      ? <p className="py-16 text-center text-sm text-error" role="alert">{error}</p>
      : <p className="py-16 text-center text-sm text-muted-foreground">Memuat event...</p>;
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Informasi Event</h1>
        <p className="text-sm text-muted-foreground">
          {status === "draft"
            ? "Event ini masih draft dan belum tampil di publik. Terbitkan dari halaman denah booth."
            : "Perubahan langsung tampil di halaman publik event."}
        </p>
      </div>
      <form onSubmit={save} className="card-base p-6 space-y-4">
        {FIELDS.map(({ key, label, multiline }) => (
          <label key={key} className="block text-sm font-medium">
            {label}
            {multiline ? (
              <textarea className="input-base mt-2 min-h-32" value={String(event[key] ?? "")} onChange={(e) => update(key, e.target.value)} />
            ) : (
              <input className="input-base mt-2" value={String(event[key] ?? "")} onChange={(e) => update(key, e.target.value)} />
            )}
          </label>
        ))}
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : saved ? "Tersimpan" : "Simpan Perubahan"}
          </button>
          {status === "draft" ? (
            <button type="button" className="btn btn-secondary" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/floor-plan`)}>
              Lanjut ke Denah Booth
            </button>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={() => router.push(`/events/${eventId}`)}>
              Lihat Event
            </button>
          )}
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
