import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase";
import { auditLog, getClientIp } from "@/lib/admin-audit";

const MAX_ATTEMPTS = 5;
const WINDOW_SECS  = 15 * 60;

async function getRecentFailures(ip: string): Promise<number> {
  const supabase = createAdminClient();
  const since    = new Date(Date.now() - WINDOW_SECS * 1000).toISOString();
  const { count } = await supabase
    .from("admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", since);
  return count ?? 0;
}

async function recordAttempt(ip: string, success: boolean) {
  const supabase = createAdminClient();
  await supabase.from("admin_login_attempts").insert({ ip, success });
}

async function pruneOldAttempts() {
  const supabase = createAdminClient();
  const cutoff   = new Date(Date.now() - WINDOW_SECS * 2 * 1000).toISOString();
  await supabase.from("admin_login_attempts").delete().lt("created_at", cutoff);
}

/**
 * POST /api/admin/login
 * Rate-limited: 5 failures / IP / 15 min → 429 + Retry-After.
 * Adds timing delay on failure to frustrate enumeration.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    const failures = await getRecentFailures(ip);
    if (failures >= MAX_ATTEMPTS) {
      void auditLog("login_blocked", req, { ip, failures });
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": String(WINDOW_SECS) } }
      );
    }

    const { password } = (await req.json()) as { password?: string };
    const secret       = process.env.ADMIN_SECRET;

    if (!secret || !password || password !== secret) {
      void recordAttempt(ip, false);
      void auditLog("login_failure", req, { ip });
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    void recordAttempt(ip, true);
    void auditLog("login_success", req, { ip });
    void pruneOldAttempts();

    const token = await computeAdminToken();
    const res   = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
