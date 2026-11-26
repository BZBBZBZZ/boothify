"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublishedEvents, errorMessage } from "@/app/lib/db";
import type { EventDetail } from "@/app/lib/event-defaults";
import Icon from "../../components/Icon";
import { EmptyState, Notice, PageHeader } from "../../components/ui";

/** Admin overview: every published event, its organizer and how full its booths are. */
export default function AdminDashboard() {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listPublishedEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Daftar event gagal dimuat."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const organizers = new Set(events.map((e) => e.organizerId || e.organizer)).size;
  const boothsTotal = events.reduce((sum, e) => sum + (e.boothsTotal || 0), 0);
  const boothsFilled = events.reduce((sum, e) => sum + (e.boothsFilled || 0), 0);

  return (
    <div className="animate-fade-in space-y-6" id="admin-overview">
      <PageHeader title="Dasbor Admin" description="Ringkasan semua event yang sudah diterbitkan di Boothify." />

      {loadError && <Notice tone="error">{loadError}</Notice>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl font-bold mb-1">{events.length}</div>
          <div className="text-xs text-muted-foreground">Event terbit</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-bold mb-1">{organizers}</div>
          <div className="text-xs text-muted-foreground">Organizer aktif</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-bold mb-1">{boothsFilled}</div>
          <div className="text-xs text-muted-foreground">Booth tersewa</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-bold mb-1">{boothsTotal > 0 ? Math.round((boothsFilled / boothsTotal) * 100) : 0}%</div>
          <div className="text-xs text-muted-foreground">Tingkat keterisian booth</div>
        </div>
      </div>

      <section className="card-base p-6">
        <h2 className="section-title mb-4">Daftar event</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat event...</p>
        ) : events.length === 0 ? (
          <EmptyState icon={<Icon name="calendar" size={32} />} title="Belum ada event yang diterbitkan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger-table text-sm">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Organizer</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Lokasi</th>
                  <th scope="col">Booth</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="ledger-row">
                    <td>
                      <Link href={`/events/${e.id}`} className="font-medium text-foreground hover:underline">
                        {e.title}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">
                      {e.organizer}
                      {e.organizerEmail && <span className="block text-xs">{e.organizerEmail}</span>}
                    </td>
                    <td className="text-muted-foreground">{e.date}</td>
                    <td className="text-muted-foreground">{e.location}</td>
                    <td className="fig">
                      {e.boothsFilled || 0}/{e.boothsTotal || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
