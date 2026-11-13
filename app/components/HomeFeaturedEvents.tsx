"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublishedEvents, errorMessage } from "../lib/db";
import { isUpcomingEvent } from "../lib/tenant-events";
import type { EventDetail } from "../lib/event-defaults";

/** Upcoming published events from the database, newest first. */
export default function HomeFeaturedEvents() {
  const [events, setEvents] = useState<EventDetail[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listPublishedEvents()
      .then((list) => {
        if (!cancelled) setEvents(list.filter((e) => isUpcomingEvent(e.date)).slice(0, 4));
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Event gagal dimuat."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const message = error
    ? error
    : events === null
    ? "Memuat event..."
    : events.length === 0
    ? "Belum ada event yang diterbitkan. Event baru akan tampil di sini."
    : "";

  return (
    <table className="ledger-table">
      <caption className="visually-hidden">Event pilihan dan booth yang sudah terisi</caption>
      <thead>
        <tr>
          <th scope="col">Event</th>
          <th scope="col">Tanggal</th>
          <th scope="col" className="ledger-col-place">Lokasi</th>
          <th scope="col" className="ledger-col-cat">Kategori</th>
          <th scope="col" className="ledger-col-fill">Booth terisi</th>
        </tr>
      </thead>
      <tbody>
        {message ? (
          <tr className="ledger-row">
            <td colSpan={5} className="text-sm text-muted-foreground">{message}</td>
          </tr>
        ) : (
          (events || []).map((event) => (
            <tr key={event.id} className="ledger-row">
              <td>
                <Link href={`/events/${event.id}`} className="ledger-link" id={`event-card-${event.id}`}>
                  {event.title}
                </Link>
              </td>
              <td className="ledger-date fig">{event.date}</td>
              <td className="ledger-col-place">{event.location}</td>
              <td className="ledger-col-cat">
                <span className="ledger-tag">{event.categories?.[0] || event.category}</span>
              </td>
              <td className="ledger-col-fill fig">
                {event.boothsFilled}
                <span className="ledger-total">/{event.boothsTotal}</span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
