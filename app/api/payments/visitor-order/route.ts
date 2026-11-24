import { createVisitorOrderPayment } from "@/app/lib/server/payments";
import { ApiError, errorResponse, json } from "@/app/lib/server/errors";

// Visitor food orders. Open to guests on purpose: no login is required, and prices come from the database.
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Permintaan tidak valid.");
    }
    return json(await createVisitorOrderPayment(body));
  } catch (err) {
    return errorResponse(err);
  }
}
