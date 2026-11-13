import { listTenantBookings } from "./db";

const MONTHS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agt: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

/**
 * The last day of an event from its date text. Handles the formats in use:
 * "2026-10-22 s/d 2026-10-23", "15–17 November 2026", "15-17 Nov 2026", "1 Des 2026".
 * Returns null when the text cannot be read.
 */
export function eventEndDate(text: string | undefined | null): Date | null {
  const value = String(text || "");
  const iso = value.match(/\d{4}-\d{2}-\d{2}/g);
  if (iso && iso.length > 0) return new Date(`${iso[iso.length - 1]}T23:59:59`);

  const m = value.match(/(\d{1,2})\s*(?:[–—-]\s*(\d{1,2}))?\s+([A-Za-z]+)\.?\s+(\d{4})/);
  if (m) {
    const word = m[3].toLowerCase();
    const month = MONTHS[word] ?? MONTHS[word.slice(0, 3)];
    if (month !== undefined) {
      return new Date(Number(m[4]), month, Number(m[2] || m[1]), 23, 59, 59);
    }
  }
  return null;
}

/** An event counts as upcoming until its last day is over; unreadable dates count as upcoming. */
export function isUpcomingEvent(dateText: string | undefined | null, now = new Date()): boolean {
  const end = eventEndDate(dateText);
  return end ? end.getTime() >= now.getTime() : true;
}

export type TenantEvent = { id: string; title: string; date: string; booths: string[] };

/** Events this tenant has booked a booth at and that have not ended yet. */
export async function getTenantUpcomingEvents(tenantId: string): Promise<TenantEvent[]> {
  if (!tenantId) return [];
  const bookings = await listTenantBookings(tenantId);
  const byEvent = new Map<string, TenantEvent>();
  bookings.forEach((b) => {
    const current = byEvent.get(b.eventId) || { id: b.eventId, title: b.event, date: b.date, booths: [] };
    if (!current.booths.includes(b.booth)) current.booths.push(b.booth);
    byEvent.set(b.eventId, current);
  });
  return Array.from(byEvent.values()).filter((e) => isUpcomingEvent(e.date));
}
