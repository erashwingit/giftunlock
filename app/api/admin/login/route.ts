import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { createHash, timingSafeEqual } from "crypto";

/* ─────────────────────────────────────────────────────────────
   In-memory brute-force protection
   • 5 failed attempts per IP within a 15-minute window → locked
   • Resets automatically after 15 minutes (TTL-based cleanup)
   • State is per-process — resets on redeploy (acceptable trade-off
     for zero-dependency protection on Vercel serverless)
───────────────────────────────────────────────────────────── */

interface Attempt {
  count: number;
  firstAt: number; // ms timestamp of first failed attempt in window
}

const WINDOW_MS   = 15 * 60 * 1000; // 15 minutes
const MAX_FAILS   = 5;               // attempts before lockout
const attempts    = new Map<string, Attempt>();

/** Returns the client IP from the request, falling back to "unknown". */
function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Constant-time string comparison — prevents timing-based password leaks. */
function safeCompare(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Check whether this IP is currently rate-limited. */
function isLocked(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  const age = Date.now() - entry.firstAt;
  if (age > WINDOW_MS) {
    attempts.delete(ip);   // window expired — clean up
    return false;
  }
  return entry.count >= MAX_FAILS;
}

/** Record a failed attempt for this IP. */
function recordFailure(ip: string): void {
  const now   = Date.now();
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

/** Clear failure record on successful login. */
function clearFailures(ip: string): void {
  attempts.delete(ip);
}

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/login
───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  /* 1. Rate-limit / lockout check */
  if (isLocked(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as { password?: string };
    const password = typeof body.password === "string" ? body.password : "";
    const secret   = process.env.ADMIN_SECRET ?? "";

    /* 2. Constant-time password comparison */
    const valid = secret.length > 0 && safeCompare(password, secret);

    if (!valid) {
      recordFailure(ip);
      /* 3. Generic error — never reveal whether password or username was wrong */
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    /* ── Success ── */
    clearFailures(ip);

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
