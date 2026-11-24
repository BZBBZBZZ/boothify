import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import midtransClient, { type MidtransStatusResponse } from "midtrans-client";
import { ApiError } from "./errors";

/**
 * Midtrans SANDBOX only. The SDK is created with isProduction: false (Snap Sandbox URL), and the
 * server key must be a Sandbox key. There is deliberately no switch for Production.
 *
 * MIDTRANS_SERVER_KEY is read here and nowhere else. It must never reach the browser.
 */

const SANDBOX_SERVER_KEY_PREFIX = "SB-Mid-server-";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";

export type SnapItem = { id: string; name: string; price: number; quantity: number };

type SnapClient = InstanceType<typeof midtransClient.Snap>;
let snap: SnapClient | null = null;

function serverKey(): string {
  const key = (process.env.MIDTRANS_SERVER_KEY || "").trim();
  if (!key) {
    console.error("[midtrans] MIDTRANS_SERVER_KEY belum diisi di .env.local");
    throw new ApiError(503, "Pembayaran belum dikonfigurasi di server.");
  }
  if (!key.startsWith(SANDBOX_SERVER_KEY_PREFIX)) {
    console.error("[midtrans] MIDTRANS_SERVER_KEY bukan kunci Sandbox (harus diawali SB-Mid-server-)");
    throw new ApiError(503, "Pembayaran belum dikonfigurasi di server.");
  }
  return key;
}

function getSnap(): SnapClient {
  if (snap) return snap;
  snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: serverKey(),
    clientKey: (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim() || undefined,
  });
  return snap;
}

/** Midtrans errors carry the API response; keep only the readable messages. */
function gatewayMessage(err: unknown): string {
  const response = (err as { ApiResponse?: { error_messages?: unknown } } | null)?.ApiResponse;
  const messages = response?.error_messages;
  if (Array.isArray(messages) && messages.length > 0) return messages.map(String).join("; ");
  return err instanceof Error ? err.message : "unknown error";
}

function httpStatusOf(err: unknown): number {
  const raw = (err as { httpStatusCode?: unknown } | null)?.httpStatusCode;
  return Number(raw) || 0;
}

export type SnapTransactionInput = {
  orderId: string;
  /** Whole rupiah, computed from the database. */
  amount: number;
  items: SnapItem[];
  customer: { name: string; email?: string | null; phone?: string | null };
  expiryMinutes: number;
};

/** Phone numbers are optional in Snap; only forward ones that look like phone numbers. */
function cleanPhone(phone?: string | null): string | undefined {
  const value = (phone || "").trim();
  return /^\+?[0-9][0-9\s-]{4,19}$/.test(value) ? value : undefined;
}

/** Ask Snap for a payment token. The amount and items come from the database, never the browser. */
export async function createSnapToken(input: SnapTransactionInput): Promise<string> {
  const itemsTotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (itemsTotal !== input.amount) {
    console.error(`[midtrans] item_details (${itemsTotal}) tidak sama dengan gross_amount (${input.amount}) untuk ${input.orderId}`);
    throw new ApiError(500, "Rincian pembayaran tidak konsisten. Hubungi admin.");
  }

  const email = (input.customer.email || "").trim();
  const parameter = {
    transaction_details: { order_id: input.orderId, gross_amount: input.amount },
    item_details: input.items.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50),
      price: item.price,
      quantity: item.quantity,
    })),
    customer_details: {
      first_name: (input.customer.name || "Pelanggan").slice(0, 100),
      ...(email ? { email } : {}),
      ...(cleanPhone(input.customer.phone) ? { phone: cleanPhone(input.customer.phone) } : {}),
    },
    expiry: { unit: "minutes", duration: input.expiryMinutes },
  };

  try {
    const result = await getSnap().createTransaction(parameter);
    if (!result?.token) throw new Error("Midtrans tidak mengembalikan token.");
    return result.token;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`[midtrans] gagal membuat transaksi ${input.orderId}: ${gatewayMessage(err)}`);
    throw new ApiError(502, "Midtrans tidak bisa membuat transaksi saat ini. Coba lagi sebentar lagi.");
  }
}

/**
 * Get Status API. Returns null when Midtrans has no transaction for this order yet
 * (a Snap token exists before the customer picks a payment method).
 */
export async function getTransactionStatus(orderId: string): Promise<MidtransStatusResponse | null> {
  try {
    return await getSnap().transaction.status(orderId);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (httpStatusOf(err) === 404) return null;
    console.error(`[midtrans] gagal membaca status ${orderId}: ${gatewayMessage(err)}`);
    throw new ApiError(502, "Status pembayaran belum bisa dibaca dari Midtrans.");
  }
}

/**
 * Notification signature, as documented by Midtrans:
 *   signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
 * The three fields are used exactly as received (gross_amount stays a string like "150000.00").
 */
export function isValidNotificationSignature(body: Record<string, unknown>): boolean {
  const { order_id, status_code, gross_amount, signature_key } = body;
  if (
    typeof order_id !== "string" ||
    typeof status_code !== "string" ||
    typeof gross_amount !== "string" ||
    typeof signature_key !== "string" ||
    !order_id ||
    !status_code ||
    !gross_amount ||
    !signature_key
  ) {
    return false;
  }
  const expected = createHash("sha512").update(`${order_id}${status_code}${gross_amount}${serverKey()}`).digest();
  const given = Buffer.from(signature_key, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Midtrans transaction_status (+ fraud_status) to the payment status stored in the database. */
export function toPaymentStatus(
  transactionStatus: string | undefined,
  fraudStatus: string | undefined,
  statusCode: string | undefined
): PaymentStatus {
  switch (transactionStatus) {
    case "settlement":
      return statusCode === "200" ? "paid" : "pending";
    case "capture":
      // Card payments: only a capture that passed fraud detection counts. "challenge" waits for review.
      return statusCode === "200" && fraudStatus === "accept" ? "paid" : "pending";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "failure":
      return "failed";
    case "refund":
    case "chargeback":
      return "refunded";
    // "deny" can still become a success when the customer retries inside the same Snap page,
    // so it is not final. "pending", "authorize", partial refunds, and anything new stay as they are.
    default:
      return "pending";
  }
}

/** One key per distinct notification, so a repeated delivery is recognised. */
export function notificationEventKey(body: Record<string, unknown>): string {
  const parts = ["order_id", "transaction_id", "transaction_status", "fraud_status", "status_code", "transaction_time"].map((k) =>
    String(body[k] ?? "")
  );
  return createHash("sha256").update(parts.join("|")).digest("hex");
}
