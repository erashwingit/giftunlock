import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

/** POST /api/admin/logout — Clears the admin session cookie + audit log. */
export async function POST(req: NextRequest) {
  void auditLog("logout", req);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
  return res;
}
