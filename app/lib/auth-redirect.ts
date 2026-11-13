import type { Role } from "../components/AuthContext";

/** The page each role lands on after signing in. */
export function homeForRole(role: Role | undefined): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "organizer") return "/dashboard/organizer";
  if (role === "tenant") return "/dashboard/tenant";
  return "/events";
}

/**
 * Only follow a `next` target that stays inside this site,
 * so a crafted link cannot send someone to another domain after login.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.startsWith("/auth/")) return null;
  return next;
}

/** Build a login link that returns to `path` afterwards. */
export function loginUrlFor(path: string): string {
  return `/auth/login?next=${encodeURIComponent(path)}`;
}
