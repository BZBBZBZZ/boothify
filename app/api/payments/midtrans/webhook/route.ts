import { handleMidtransNotification } from "@/app/lib/server/payments";
import { errorResponse, json } from "@/app/lib/server/errors";

// Midtrans HTTP notification. Set this URL in the Midtrans Sandbox dashboard:
// Settings > Configuration > Payment Notification URL.
// It is public by design: every request is authenticated by Midtrans' signature_key.
export async function POST(request: Request) {
  try {
    const result = await handleMidtransNotification(await request.text());
    return json(result.body, result.status);
  } catch (err) {
    return errorResponse(err);
  }
}
