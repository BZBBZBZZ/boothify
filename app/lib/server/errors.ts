import "server-only";

/** An error whose message is safe to show to the person who made the request. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

/** Turn anything thrown in a route into a response. Unknown errors are logged, never echoed. */
export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) return json({ error: err.message }, err.status);
  console.error("[payments] unexpected error:", err instanceof Error ? err.message : err);
  return json({ error: "Terjadi kesalahan di server. Coba lagi." }, 500);
}
