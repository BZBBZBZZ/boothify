import "server-only";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors";
import { getSupabaseAdmin } from "./supabase-admin";
import {
  createSnapToken,
  getTransactionStatus,
  isValidNotificationSignature,
  notificationEventKey,
  toPaymentStatus,
  type PaymentStatus,
  type SnapItem,
} from "./midtrans";

/** How long a Snap payment page stays valid (the booth is held 2 minutes longer, see the migration). */
const BOOTH_PAYMENT_MINUTES = 30;
const ORDER_PAYMENT_MINUTES = 15;
/** The Get Status fallback is asked at most this often per payment. */
const SYNC_INTERVAL_MS = 10_000;

type Customer = { name: string; email?: string | null; phone?: string | null };

type CreatedPayment = {
  reused?: boolean;
  payment_id: string;
  order_id: string;
  amount: number;
  items: SnapItem[];
  snap_token?: string | null;
  access_token?: string;
  expires_at: string;
  customer: Customer;
};

type PaymentRow = {
  id: string;
  order_id: string;
  kind: "booking" | "visitor_order";
  tenant_id: string | null;
  amount: number;
  status: PaymentStatus;
  midtrans_status: string | null;
  payment_type: string | null;
  snap_token: string | null;
  snap_expires_at: string;
  access_token: string;
  paid_at: string | null;
  last_synced_at: string | null;
};

// ----------------------------------------------------------------------------
// Identity
// ----------------------------------------------------------------------------

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

/** The signed-in Supabase user behind a request, checked by Supabase Auth itself. */
async function getRequestUser(request: Request): Promise<{ id: string; role: string } | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin.from("profiles").select("id, role").eq("id", data.user.id).maybeSingle();
  return profile ? { id: String(profile.id), role: String(profile.role) } : null;
}

export async function requireTenant(request: Request): Promise<{ id: string }> {
  if (!bearerToken(request)) throw new ApiError(401, "Silakan masuk dengan akun tenant.");
  const user = await getRequestUser(request);
  if (!user) throw new ApiError(401, "Sesi masuk tidak valid. Silakan masuk ulang.");
  if (user.role !== "tenant") throw new ApiError(403, "Sewa booth hanya bisa dilakukan dengan akun tenant.");
  return { id: user.id };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Database functions raise readable messages (P0001); anything else is a server problem. */
function rpcError(error: { message: string; code?: string }): never {
  if (error.code === "P0001") throw new ApiError(409, error.message);
  console.error("[payments] database error:", error.code, error.message);
  if (/function .* does not exist|schema cache|payments/i.test(error.message)) {
    throw new ApiError(503, "Database pembayaran belum disiapkan. Jalankan migration Midtrans di Supabase.");
  }
  throw new ApiError(500, "Terjadi kesalahan di server. Coba lagi.");
}

function newOrderId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(5).toString("hex")}`;
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

/** Records a failed attempt so the held booth / order is released right away. */
async function markFailed(orderId: string, reason: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("apply_payment_status", {
    p_order_id: orderId,
    p_new_status: "failed",
    p_midtrans_status: reason,
    p_fraud_status: null,
    p_status_code: null,
    p_payment_type: null,
    p_transaction_id: null,
    p_event_key: `local-failure:${orderId}`,
    p_payload: { reason },
  });
  if (error) console.error("[payments] gagal membatalkan pembayaran", orderId, error.message);
}

async function issueSnapToken(created: CreatedPayment, minutes: number): Promise<string> {
  const remaining = Math.ceil((new Date(created.expires_at).getTime() - Date.now()) / 60000);
  try {
    const token = await createSnapToken({
      orderId: created.order_id,
      amount: Number(created.amount),
      items: created.items,
      customer: created.customer,
      expiryMinutes: Math.max(5, Math.min(minutes, remaining)),
    });
    const { error } = await getSupabaseAdmin().from("payments").update({ snap_token: token }).eq("id", created.payment_id);
    if (error) throw new ApiError(500, "Terjadi kesalahan di server. Coba lagi.");
    return token;
  } catch (err) {
    // A fresh payment that never got a token would hold its booth / order for nothing
    if (!created.reused) await markFailed(created.order_id, "snap_token_failed");
    throw err;
  }
}

// ----------------------------------------------------------------------------
// Create transactions
// ----------------------------------------------------------------------------

export async function createBoothPayment(request: Request, body: unknown) {
  const tenant = await requireTenant(request);
  const input = (body && typeof body === "object" ? body : {}) as { eventId?: unknown; booths?: unknown };
  const eventId = text(input.eventId, 100);
  const booths = Array.isArray(input.booths) ? input.booths.map((b) => text(b, 100)).filter(Boolean) : [];
  if (!eventId) throw new ApiError(400, "Event tidak valid.");
  if (booths.length === 0) throw new ApiError(400, "Pilih minimal satu booth.");
  if (booths.length > 10) throw new ApiError(400, "Maksimal 10 booth dalam satu pembayaran.");

  const { data, error } = await getSupabaseAdmin().rpc("create_booth_payment", {
    p_tenant_id: tenant.id,
    p_event_id: eventId,
    p_labels: booths,
    p_order_id: newOrderId("BK"),
    p_expiry_minutes: BOOTH_PAYMENT_MINUTES,
  });
  if (error) rpcError(error);

  const created = data as CreatedPayment;
  const snapToken = created.snap_token || (await issueSnapToken(created, BOOTH_PAYMENT_MINUTES));
  return { orderId: created.order_id, snapToken, amount: Number(created.amount), expiresAt: created.expires_at };
}

export async function createVisitorOrderPayment(body: unknown) {
  const input = (body && typeof body === "object" ? body : {}) as {
    eventId?: unknown;
    booth?: unknown;
    items?: unknown;
    customerName?: unknown;
    customerPhone?: unknown;
  };
  const eventId = text(input.eventId, 100);
  const booth = text(input.booth, 100);
  if (!eventId || !booth) throw new ApiError(400, "Event atau booth tidak valid.");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new ApiError(400, "Keranjang kosong.");
  if (input.items.length > 30) throw new ApiError(400, "Maksimal 30 jenis menu dalam satu pesanan.");

  // Only names and quantities are taken from the browser; prices come from the tenant's menu in the database
  const items = input.items.map((raw) => {
    const row = (raw && typeof raw === "object" ? raw : {}) as { name?: unknown; qty?: unknown };
    const qty = Number(row.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new ApiError(400, "Jumlah menu harus 1 sampai 50.");
    return { name: text(row.name, 200), qty };
  });
  if (items.some((i) => !i.name)) throw new ApiError(400, "Nama menu wajib diisi.");

  const { data, error } = await getSupabaseAdmin().rpc("create_visitor_order_payment", {
    p_event_id: eventId,
    p_booth: booth,
    p_items: items,
    p_customer_name: text(input.customerName, 80),
    p_customer_phone: text(input.customerPhone, 30),
    p_expiry_minutes: ORDER_PAYMENT_MINUTES,
  });
  if (error) rpcError(error);

  const created = data as CreatedPayment;
  const snapToken = await issueSnapToken(created, ORDER_PAYMENT_MINUTES);
  return {
    orderId: created.order_id,
    accessToken: created.access_token || "",
    snapToken,
    amount: Number(created.amount),
    expiresAt: created.expires_at,
  };
}

// ----------------------------------------------------------------------------
// Read status
// ----------------------------------------------------------------------------

const PAYMENT_COLUMNS =
  "id, order_id, kind, tenant_id, amount, status, midtrans_status, payment_type, snap_token, snap_expires_at, access_token, paid_at, last_synced_at";

async function loadPayment(orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await getSupabaseAdmin().from("payments").select(PAYMENT_COLUMNS).eq("order_id", orderId).maybeSingle();
  if (error) rpcError(error);
  return (data as PaymentRow | null) ?? null;
}

/**
 * Applies a Midtrans status to a payment through the one database function that is allowed to.
 * Safe to call repeatedly with the same data.
 */
async function applyStatus(
  orderId: string,
  source: Record<string, unknown>
): Promise<{ found: boolean; status?: PaymentStatus; changed?: boolean }> {
  const transactionStatus = typeof source.transaction_status === "string" ? source.transaction_status : undefined;
  const fraudStatus = typeof source.fraud_status === "string" ? source.fraud_status : undefined;
  const statusCode = typeof source.status_code === "string" ? source.status_code : undefined;

  // The signature is a secret derived from the server key; it is never stored
  const { signature_key: _signature, ...payload } = source;
  void _signature;

  const { data, error } = await getSupabaseAdmin().rpc("apply_payment_status", {
    p_order_id: orderId,
    p_new_status: toPaymentStatus(transactionStatus, fraudStatus, statusCode),
    p_midtrans_status: transactionStatus ?? null,
    p_fraud_status: fraudStatus ?? null,
    p_status_code: statusCode ?? null,
    p_payment_type: typeof source.payment_type === "string" ? source.payment_type : null,
    p_transaction_id: typeof source.transaction_id === "string" ? source.transaction_id : null,
    p_event_key: notificationEventKey(source),
    p_payload: payload,
  });
  if (error) rpcError(error);
  return data as { found: boolean; status?: PaymentStatus; changed?: boolean };
}

/**
 * Fallback when a webhook has not arrived (for example the tunnel is down): ask Midtrans directly
 * through the server-to-server Get Status API and feed the answer through the same function.
 * Nothing from the browser is trusted.
 */
async function syncFromMidtrans(payment: PaymentRow): Promise<void> {
  const last = payment.last_synced_at ? new Date(payment.last_synced_at).getTime() : 0;
  if (Date.now() - last < SYNC_INTERVAL_MS) return;

  const admin = getSupabaseAdmin();
  await admin.from("payments").update({ last_synced_at: new Date().toISOString() }).eq("id", payment.id);

  const status = await getTransactionStatus(payment.order_id);
  if (!status) return;
  if (status.gross_amount !== undefined && Number(status.gross_amount) !== Number(payment.amount)) {
    console.error(`[payments] nominal Midtrans (${status.gross_amount}) berbeda dari database (${payment.amount}) untuk ${payment.order_id}`);
    return;
  }
  await applyStatus(payment.order_id, status);
}

export async function getPaymentStatus(request: Request, orderId: string, accessToken: string) {
  if (!orderId) throw new ApiError(400, "Kode pembayaran wajib diisi.");

  const admin = getSupabaseAdmin();
  await admin.rpc("expire_stale_payments");

  let payment = await loadPayment(orderId);
  // Unknown order and wrong credentials look the same, so order codes cannot be probed
  const notFound = new ApiError(404, "Pembayaran tidak ditemukan.");
  if (!payment) throw notFound;

  if (payment.kind === "visitor_order") {
    // Guests have no account: the secret handed out when the order was created proves ownership
    if (!accessToken || !safeEqual(accessToken, payment.access_token)) throw notFound;
  } else {
    const user = await getRequestUser(request);
    if (!user || user.id !== payment.tenant_id) throw notFound;
  }

  if (payment.status === "pending") {
    try {
      await syncFromMidtrans(payment);
    } catch (err) {
      // Reading must not fail just because the fallback could not reach Midtrans
      console.error("[payments] sinkronisasi status gagal:", err instanceof Error ? err.message : err);
    }
    payment = (await loadPayment(orderId)) || payment;
  }

  const resumable = payment.status === "pending" && payment.snap_token && new Date(payment.snap_expires_at).getTime() > Date.now();
  return {
    orderId: payment.order_id,
    status: payment.status,
    midtransStatus: payment.midtrans_status,
    paymentType: payment.payment_type,
    amount: Number(payment.amount),
    paidAt: payment.paid_at,
    snapToken: resumable ? payment.snap_token : null,
  };
}

// ----------------------------------------------------------------------------
// Webhook
// ----------------------------------------------------------------------------

/**
 * HTTP notification from Midtrans. The signature proves it came from Midtrans, the amount must match
 * what the database computed, and the database function makes repeated deliveries harmless.
 * This is where a payment becomes "paid".
 */
export async function handleMidtransNotification(rawBody: string): Promise<{ status: number; body: Record<string, unknown> }> {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return { status: 400, body: { error: "Body notifikasi tidak valid." } };
  }

  if (!isValidNotificationSignature(body)) {
    console.error("[payments] notifikasi ditolak: signature_key tidak cocok");
    return { status: 401, body: { error: "Signature tidak valid." } };
  }

  const orderId = String(body.order_id);
  const payment = await loadPayment(orderId);
  if (!payment) {
    // Genuine Midtrans traffic for an order this app does not know (for example the dashboard's test
    // button). Answering 200 stops pointless retries.
    return { status: 200, body: { ok: true, ignored: "unknown_order" } };
  }

  if (Number(body.gross_amount) !== Number(payment.amount)) {
    console.error(`[payments] nominal notifikasi (${String(body.gross_amount)}) berbeda dari database (${payment.amount}) untuk ${orderId}`);
    await getSupabaseAdmin()
      .from("payments")
      .update({ needs_review: true, review_note: `Nominal notifikasi Midtrans (${String(body.gross_amount)}) berbeda dari nominal di database.` })
      .eq("id", payment.id);
    return { status: 200, body: { ok: true, ignored: "amount_mismatch" } };
  }

  // A database failure answers 500 so that Midtrans retries the notification
  const result = await applyStatus(orderId, body);
  return { status: 200, body: { ok: true, status: result.status ?? null, changed: Boolean(result.changed) } };
}
