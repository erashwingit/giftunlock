import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets HTTP-only admin_token cookie on success.
 *
 * RATE LIMITING — TODO: Implement brute-force protection using the
 * `admin_login_attempts` table in Supabase.
 *
 * Recommended schema:
 *   CREATE TABLE admin_login_attempts (
 *     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     ip         text NOT NULL,
 *     attempted_at timestamptz DEFAULT now()
 *   );
 *   CREATE INDEX ON admin_login_attempts (ip, attempted_at);
 *
 * Logic to add before the password check:
 *   1. Extract client IP from request headers (x-forwarded-for or x-real-ip).
 *   2. Count rows in admin_login_attempts WHERE ip = $ip
 *      AND attempted_at > now() - interval '15 minutes'.
 *   3. If count >= 5, return 429 Too Many Requests.
 *   4. On each failed login, INSERT a row into admin_login_attempts.
 *   5. On success, optionally DELETE old rows for that IP.
 *
 * This prevents brute-force attacks: max 5 failed attempts per IP per 15 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json()) as { password?: string };
    const secret = process.env.ADMIN_SECRET;

    if (!secret || !password || password !== secret) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await computeAdminToken();
    const res   = NextResponse.json({ ok: true });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     "/",
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
