import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets HTTP-only admin_token cookie on success.
 *
 * RATE LIMITING: Brute-force protection via `admin_login_attempts` table.
 * Max 5 failed attempts per IP per 15 minutes → 429 lockout.
 *
 * Required Supabase migration (run once):
 *   CREATE TABLE IF NOT EXISTS admin_login_attempts (
 *     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     ip           text NOT NULL,
 *     attempted_at timestamptz NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time
 *     ON admin_login_attempts (ip, attempted_at);
 */

const MAX_ATTEMPTS    = 5;
const WINDOW_MINUTES  = 15;

/** Extract best-effort client IP from request headers */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const ip = getClientIp(req);

  try {
    /* ── Rate limit check ──────────────────────────────── */
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${WINDOW_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    /* ── Password check ────────────────────────────────── */
    const { password } = (await req.json()) as { password?: string };
    const secret = process.env.ADMIN_SECRET;

    if (!secret || !password || password !== secret) {
      // Record failed attempt
      await supabase
        .from("admin_login_attempts")
        .insert({ ip, attempted_at: new Date().toISOString() });

      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    /* ── Success: clear attempts for this IP, set cookie ─ */
    await supabase
      .from("admin_login_attempts")
      .delete()
      .eq("ip", ip);

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
