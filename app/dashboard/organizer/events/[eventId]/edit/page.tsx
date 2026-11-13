"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../components/AuthContext";
import { getEventMeta, type EventDetail } from "../../../../../lib/event-defaults";
import { saveEventToSupabase, getEventByIdFromSupabase } from "@/app/lib/supabase-service";

const FIELDS: Array<{ key: keyof EventDetail; label: string; multiline?: boolean }> = [
  { key: "title", label: "Nama Event" },
  { key: "date", label: "Tanggal" },
  { key: "time", label: "Waktu" },
  { key: "location", label: "Nama Venue" },
  { key: "address", label: "Alamat Lengkap" },
  { key: "priceRange", label: "Rentang Harga Sewa Booth" },
  { key: "description", label: "Deskripsi", multiline: true },
];

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "");
  const { user, isLoading } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    let cancelled = false;

    const applyOwned = (loaded: EventDetail) => {
      // Only the organizer who owns the event may edit it
      if (loaded.organizerEmail && loaded.organizerEmail.toLowerCase() !== user.email.toLowerCase()) {
        router.replace(`/events/${eventId}`);
        return;
      }
      setEvent(loaded);
    };

    // A draft lives on this device; a published event can be loaded from Supabase
    const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
    const local = Array.isArray(stored) ? stored.find((item: { id: string }) => String(item.id) === eventId) : null;
    if (local) {
      setStatus(local.status || "active");
      applyOwned(getEventMeta(eventId));
    } else {
      getEventByIdFromSupabase(eventId).then((remote) => {
        if (cancelled) return;
        if (remote) applyOwned(remote);
        else router.replace("/dashboard/organizer");
      });
    }
    return () => {
      cancelled = true;
    };
  }, [eventId, isLoading, router, user]);

  const update = (key: keyof EventDetail, value: string) =>
    setEvent((current) => (current ? { ...current, [key]: value } : current));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || saving) return;
    setSaving(true);
    const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
    const list = Array.isArray(stored) ? stored : [];
    const updated = list.some((item: { id: string }) => String(item.id) === eventId)
      ? list.map((item: { id: string }) => (String(item.id) === eventId ? { ...item, ...event, status } : item))
      : [{ ...event, status }, ...list];
    localStorage.setItem("boothify_events", JSON.stringify(updated));

    // A draft stays private; a published event is updated in Supabase too
    if (status !== "draft") {
      await saveEventToSupabase(event);
    }

    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  if (!event) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Memuat event...</p>;
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
