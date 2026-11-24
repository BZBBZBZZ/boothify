import { createBoothPayment } from "@/app/lib/server/payments";
import { ApiError, errorResponse, json } from "@/app/lib/server/errors";

// Tenant booth rental. Needs the tenant's Supabase session token (Authorization: Bearer ...).
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Permintaan tidak valid.");
    }
    return json(await createBoothPayment(request, body));
  } catch (err) {
    return errorResponse(err);
  }
}
