/**
 * Admin session helpers — Edge + Node compatible.
 * The token is a deterministic SHA-256 hex derived from ADMIN_SECRET.
 * Stateless: no DB needed; changing ADMIN_SECRET automatically invalidates all sessions.
 */

export const ADMIN_COOKIE_NAME = "admin_token";
const SALT = "::giftunlock_admin_v1";

/** Compute the expected session token from the current ADMIN_SECRET */
export async function computeAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Return true if the given cookie value matches the expected token */
export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await computeAdminToken();
  return !!expected && token === expected;
}
