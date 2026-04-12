/**
 * middleware.ts — Next.js Edge Middleware for admin route protection.
 *
 * NOTE: This file MUST be named `middleware.ts` at the project root.
 * The logic was previously defined in `proxy.ts` (exported as `proxy`),
 * which is NOT loaded by Next.js. This file is the authoritative middleware.
 *
 * Protected routes: all /admin/* paths except /admin/login,
 * /api/admin/login, and /api/admin/logout.
 *
 * Security hardening:
 * - CVE-2025-29927 mitigation: blocks forged x-middleware-subrequest headers
 *   that could be used to bypass middleware authentication in Next.js.
 * - Timing-safe token comparison via isValidAdminToken (double-SHA-256).
 */

import { NextRequest, NextResponse } from "next/server";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CVE-2025-29927 mitigation ────────────────────────────────────────────
  // Block any request that injects the internal Next.js subrequest header.
  // Forging this header can allow attackers to bypass middleware in affected
  // Next.js versions. Strip it unconditionally at the edge.
  if (request.headers.has("x-middleware-subrequest")) {
    return new NextResponse(null, { status: 403 });
  }

  // Only intercept /admin/* and /api/admin/* routes
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Allow login page and auth API routes through unauthenticated
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  // Validate the session cookie using timing-safe HMAC comparison
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidAdminToken(token))) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Cover both UI routes (/admin/*) and API routes (/api/admin/*).
   * Defence-in-depth: even if a per-route isAdmin() check is accidentally
   * omitted, the middleware will reject unauthenticated requests first.
   * Login and logout API routes are exempted inside the middleware function.
   */
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
