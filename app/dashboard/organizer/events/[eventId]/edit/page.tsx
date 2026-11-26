"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../components/AuthContext";
import { getEventMeta, type EventDetail } from "../../../../../lib/event-defaults";
import { saveEventToSupabase } from "@/app/lib/supabase-service";

<<<<<<< Updated upstream
export default function EditEventPage() {
=======
type TabKey = "info" | "place" | "facilities";

type TextField = { key: keyof EventDetail; label: string; hint?: string; placeholder?: string; multiline?: boolean; required?: boolean };

/* Each tab holds one kind of information, so the form is never one long scroll. */
const TAB_FIELDS: Record<Exclude<TabKey, "facilities">, TextField[]> = {
  info: [
    { key: "title", label: "Nama event", required: true },
    { key: "description", label: "Deskripsi event", multiline: true, hint: "Tampil di tab Informasi Event pada halaman publik." },
    { key: "theme", label: "Tema event", placeholder: "Contoh: Sustainable Fashion" },
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
>>>>>>> Stashed changes
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.eventId || "1");
  const { user, isLoading } = useAuth();
  const [event, setEvent] = useState<EventDetail>(getEventMeta(eventId));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "organizer")) router.push("/auth/login");
    if (!isLoading && user) {
      const loaded = getEventMeta(eventId);
      if (loaded.organizerEmail && loaded.organizerEmail.toLowerCase() !== user.email.toLowerCase()) router.push(`/events/${eventId}`);
      setEvent(loaded);
    }
  }, [eventId, isLoading, router, user]);

  const update = (key: keyof EventDetail, value: string) => setEvent((current) => ({ ...current, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem("boothify_events") || "[]");
    const updated = stored.some((item: { id: string }) => String(item.id) === eventId)
      ? stored.map((item: { id: string }) => String(item.id) === eventId ? { ...item, ...event } : item)
      : [{ ...event }, ...stored];
    localStorage.setItem("boothify_events", JSON.stringify(updated));

    // Sync ke Supabase
    await saveEventToSupabase(event);

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Informasi Event</h1>
        <p className="text-sm text-muted-foreground">Hanya organizer pemilik event yang dapat mengubah informasi ini.</p>
      </div>
      <form onSubmit={save} className="card-base p-6 space-y-4">
        {(["title", "date", "time", "location", "address", "priceRange", "description"] as const).map((key) => (
          <label key={key} className="block text-sm font-medium capitalize">
            {key === "priceRange" ? "Rentang Harga" : key}
            {key === "description" ? (
              <textarea className="input-base mt-2 min-h-32" value={event[key] || ""} onChange={(e) => update(key, e.target.value)} />
            ) : (
              <input className="input-base mt-2" value={event[key] || ""} onChange={(e) => update(key, e.target.value)} />
            )}
          </label>
        ))}
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn btn-primary">{saved ? "✓ Tersimpan" : "Simpan Perubahan"}</button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push(`/events/${eventId}`)}>Lihat Event</button>
        </div>
      </form>
    </div>
  );
<<<<<<< Updated upstream
=======
}

export default function EditEventPage() {
  return (
    <FreshOnNavigate>
      <EditEventPageContent />
    </FreshOnNavigate>
  );
>>>>>>> Stashed changes
}