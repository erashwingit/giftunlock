/**
 * middleware.ts — Next.js Edge Middleware for admin route protection.
 *
 * NOTE: This file MUST be named `middleware.ts` at the project root.
 * The logic was previously defined in `proxy.ts` (exported as `proxy`),
 * which is NOT loaded by Next.js. This file is the authoritative middleware.
 *
 * Protected routes: all /admin/* paths except /admin/login,
 * /api/admin/login, and /api/admin/logout.
 */

import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept /admin/* routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // Allow login page and auth API routes through unauthenticated
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next();
  }

  // Validate the session cookie against the expected HMAC-derived token
  const token    = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = await computeAdminToken();

  if (!token || !expected || token !== expected) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
