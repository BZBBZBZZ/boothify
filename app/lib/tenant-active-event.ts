"use client";

import { useCallback, useEffect, useState } from "react";
import { listTenantBookings, listTenantOrders, listTenantPendingBookings } from "./db";
import { eventEndDate, isUpcomingEvent } from "./tenant-events";

/**
 * The event a tenant is working on. Chosen in the sidebar ("Event dipilih") and followed by
 * the per-event pages (Katalog Produk, Pesanan & Booth). Dasbor, Mini Website and Profil
 * ignore it: they cover every event.
 */
export type TenantEventOption = {
  id: string;
  title: string;
  date: string;
  /** Booths paid for at this event. */
  booths: string[];
  /** Booths still waiting for payment. */
  heldBooths: string[];
  upcoming: boolean;
};

const storageKey = (tenantId: string) => `boothify_tenant_event_${tenantId}`;
const CHANGE_EVENT = "boothify:tenant-event-change";

// The sidebar and the page both ask for the list at the same moment: share one request
const inFlight = new Map<string, Promise<TenantEventOption[]>>();

async function fetchOptions(tenantId: string): Promise<TenantEventOption[]> {
  const [paid, held, orders] = await Promise.all([
    listTenantBookings(tenantId),
    listTenantPendingBookings(tenantId).catch(() => []),
    listTenantOrders(tenantId).catch(() => []),
  ]);
  const byId = new Map<string, TenantEventOption>();
  const get = (id: string, title: string, date: string) => {
    const current = byId.get(id) || { id, title, date, booths: [], heldBooths: [], upcoming: true };
    byId.set(id, current);
    return current;
  };
  paid.forEach((b) => {
    const e = get(b.eventId, b.event, b.date);
    if (!e.booths.includes(b.booth)) e.booths.push(b.booth);
  });
  held.forEach((b) => {
    const e = get(b.eventId, b.event, b.date);
    if (!e.heldBooths.includes(b.booth)) e.heldBooths.push(b.booth);
  });
  // Orders from an event whose booking is no longer listed still belong somewhere
  orders.forEach((o) => {
    if (o.eventId && !byId.has(o.eventId)) get(o.eventId, o.event || "Event", "");
  });

  const list = Array.from(byId.values()).map((e) => ({ ...e, upcoming: isUpcomingEvent(e.date) }));
  // Upcoming first (soonest first), then past events (latest first)
  const time = (e: TenantEventOption) => eventEndDate(e.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return list.sort((a, b) => {
    if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
    return a.upcoming ? time(a) - time(b) : time(b) - time(a);
  });
}

export function loadTenantEventOptions(tenantId: string): Promise<TenantEventOption[]> {
  if (!tenantId) return Promise.resolve([]);
  const running = inFlight.get(tenantId);
  if (running) return running;
  const request = fetchOptions(tenantId).finally(() => {
    // Keep it briefly so components mounting together reuse it, then fetch fresh next time
    window.setTimeout(() => inFlight.delete(tenantId), 3000);
  });
  inFlight.set(tenantId, request);
  return request;
}

function readStored(tenantId: string): string {
  try {
    return localStorage.getItem(storageKey(tenantId)) || "";
  } catch {
    return "";
  }
}

export function useTenantActiveEvent(tenantId: string) {
  const [events, setEvents] = useState<TenantEventOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [eventId, setEventIdState] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    loadTenantEventOptions(tenantId)
      .then((list) => {
        if (cancelled) return;
        setEvents(list);
        const stored = readStored(tenantId);
        // Last choice if it still exists, otherwise the nearest upcoming event
        setEventIdState(list.some((e) => e.id === stored) ? stored : list[0]?.id || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Event gagal dimuat.");
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // A choice made in the sidebar reaches the page (and other tabs) right away
  useEffect(() => {
    if (!tenantId) return;
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ tenantId: string; eventId: string }>).detail;
      if (detail?.tenantId === tenantId) setEventIdState(detail.eventId);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(tenantId) && e.newValue) setEventIdState(e.newValue);
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [tenantId]);

  const setEventId = useCallback(
    (id: string) => {
      setEventIdState(id);
      try {
        localStorage.setItem(storageKey(tenantId), id);
      } catch {
        /* storage unavailable: the choice lasts for this page only */
      }
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { tenantId, eventId: id } }));
    },
    [tenantId]
  );

  const event = events.find((e) => e.id === eventId);
  return { events, loaded, error, eventId, event, setEventId };
}
