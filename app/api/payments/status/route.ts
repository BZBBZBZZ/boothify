import { getPaymentStatus } from "@/app/lib/server/payments";
import { errorResponse, json } from "@/app/lib/server/errors";

// Reads a payment's status from the database. Tenants send their Bearer token; guests send the
// accessToken they received when the order was created.
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const orderId = (params.get("orderId") || "").trim();
    const accessToken = (params.get("token") || "").trim();
    return json(await getPaymentStatus(request, orderId, accessToken));
  } catch (err) {
    return errorResponse(err);
  }
}
