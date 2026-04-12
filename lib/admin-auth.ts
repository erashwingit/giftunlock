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

/**
 * Constant-time string comparison using Web Crypto SHA-256.
 * Hashing both sides before comparing ensures fixed-length output,
 * eliminating early-exit timing leaks from direct string comparison.
 * Edge Runtime compatible (no Node.js `crypto.timingSafeEqual` needed).
 *
 * Exported so API route handlers can reuse it when comparing the
 * x-admin-secret header against ADMIN_SECRET (prevents timing-oracle attacks).
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const aBytes = new Uint8Array(aHash);
  const bBytes = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

/** Return true if the given cookie value matches the expected token */
export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await computeAdminToken();
  if (!expected) return false;
  return timingSafeEqual(token, expected);
}
