import { supabase } from "./supabase";
import type { PaymentStatus } from "./db";

/**
 * Browser side of Midtrans Snap (Sandbox only).
 *
 * Snap's callbacks (onSuccess, onPending, ...) are only hints for the screen. A payment counts as
 * paid only when the server reports it, so every flow here polls fetchPaymentStatus() afterwards.
 */

const SNAP_SANDBOX_SRC = "https://app.sandbox.midtrans.com/snap/snap.js";

export type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

type SnapApi = { pay: (token: string, callbacks?: SnapCallbacks) => void };

declare global {
  interface Window {
    snap?: SnapApi;
  }
}

export class PaymentError extends Error {}

let snapLoading: Promise<SnapApi> | null = null;

/** Loads Snap.js from the Sandbox host once, using the public client key. */
export function loadSnap(): Promise<SnapApi> {
  if (typeof window === "undefined") return Promise.reject(new PaymentError("Pembayaran hanya bisa dibuka di browser."));
  if (window.snap) return Promise.resolve(window.snap);
  if (snapLoading) return snapLoading;

  const clientKey = (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim();
  const isValidClientKey =
    clientKey.startsWith("SB-Mid-client-") || clientKey.startsWith("Mid-client-");

  if (!clientKey || !isValidClientKey) {
    return Promise.reject(
      new PaymentError("Kunci client Midtrans Sandbox belum diisi (NEXT_PUBLIC_MIDTRANS_CLIENT_KEY).")
    );
  }

  snapLoading = new Promise<SnapApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SNAP_SANDBOX_SRC;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      if (window.snap) resolve(window.snap);
      else reject(new PaymentError("Midtrans Snap gagal dimuat."));
    };
    script.onerror = () => {
      script.remove();
      reject(new PaymentError("Tidak bisa memuat Midtrans Snap. Periksa koneksi internet lalu coba lagi."));
    };
    document.head.appendChild(script);
  }).catch((err) => {
    snapLoading = null;
    throw err;
  });
  return snapLoading;
}

export async function openSnap(token: string, callbacks: SnapCallbacks): Promise<void> {
  const snap = await loadSnap();
  snap.pay(token, callbacks);
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new PaymentError("Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new PaymentError((data && data.error) || "Permintaan pembayaran gagal.");
  return data as T;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type PaymentSession = { orderId: string; snapToken: string; amount: number; expiresAt: string };

/** Tenant: reserve booths and get a Snap token. Amounts are computed by the server. */
export async function startBoothPayment(eventId: string, booths: string[]): Promise<PaymentSession> {
  return request<PaymentSession>("/api/payments/booth", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ eventId, booths }),
  });
}

/** Visitor (guest allowed): create an unpaid order and get a Snap token. Only names and quantities are sent. */
export async function startVisitorOrderPayment(input: {
  eventId: string;
  booth: string;
  items: Array<{ name: string; qty: number }>;
  customerName: string;
  customerPhone: string;
}): Promise<PaymentSession & { accessToken: string }> {
  return request<PaymentSession & { accessToken: string }>("/api/payments/visitor-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export type PaymentStatusInfo = {
  orderId: string;
  status: PaymentStatus;
  midtransStatus: string | null;
  paymentType: string | null;
  amount: number;
  paidAt: string | null;
  /** Present only while the payment can still be completed. */
  snapToken: string | null;
};

/** Asks the server for the payment status. Tenants are identified by their session, guests by accessToken. */
export async function fetchPaymentStatus(orderId: string, accessToken?: string): Promise<PaymentStatusInfo> {
  const query = new URLSearchParams({ orderId });
  if (accessToken) query.set("token", accessToken);
  return request<PaymentStatusInfo>(`/api/payments/status?${query.toString()}`, {
    method: "GET",
    headers: accessToken ? {} : await authHeader(),
  });
}
