import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./errors";

let admin: SupabaseClient | null = null;

/**
 * Supabase client with the service-role key. It bypasses row-level security, so it is only
 * used by payment code on the server. SUPABASE_SERVICE_ROLE_KEY must never have a NEXT_PUBLIC_
 * prefix and must never be sent to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("[payments] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
    throw new ApiError(503, "Pembayaran belum dikonfigurasi di server.");
  }
  admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return admin;
}
