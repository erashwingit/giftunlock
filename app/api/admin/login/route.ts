import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets HTTP-only admin_token cookie on success.
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
