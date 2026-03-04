/**
 * lib/admin-auth.ts
 *
 * Shared admin authentication helper for all /api/admin/* routes.
 * Checks the x-admin-secret request header or the ?secret= query param
 * against the ADMIN_SECRET environment variable.
 */
import { NextRequest } from "next/server";

export function isAdminAuthed(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}
