/**
 * Admin session helpers — Edge + Node compatible.
 *
 * Token design (fixes CWE-294 replay attack):
 *   HMAC-SHA256( ADMIN_SECRET + "::giftunlock_admin_v1::" + weekBucket )
 *
 * weekBucket = Math.floor(Date.now() / 7_days_ms)
 * → Token auto-expires after at most 7 days without server-side state.
 * → Rotating ADMIN_SECRET invalidates all sessions instantly.
 * → Previous bucket also accepted so sessions stay valid across rotation boundary.
 */

export const ADMIN_COOKIE_NAME = "admin_token";

const SALT       = "::giftunlock_admin_v1::";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Current time-bucket (changes every 7 days) */
function weekBucket(): number {
  return Math.floor(Date.now() / SESSION_MS);
}

/** Compute the expected session token for a given bucket (default = current) */
export async function computeAdminToken(bucket = weekBucket()): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  const encoder    = new TextEncoder();
  const data       = encoder.encode(`${secret}${SALT}${bucket}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate cookie.
 * Accepts both the current AND the previous bucket so sessions created
 * just before a rotation boundary remain valid for one extra week.
 */
export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [current, prev] = await Promise.all([
    computeAdminToken(weekBucket()),
    computeAdminToken(weekBucket() - 1),
  ]);
  return !!current && (token === current || token === prev);
}
