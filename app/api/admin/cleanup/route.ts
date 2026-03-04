/**
 * POST /api/admin/cleanup
 *
 * Manually triggers abandoned-upload cleanup (same logic as the Vercel cron).
 * Deletes storage files + DB rows for orders with payment_status
 * IN ('abandoned', 'pending') older than 48 hours.
 *
 * Returns a CleanupResult with counts and MB freed.
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanAbandonedUploads } from "@/lib/cleanup";

function isAuthed(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanAbandonedUploads();

  console.log(
    `[admin/cleanup] ${result.processedAt} — ` +
    `Deleted ${result.deletedOrders} orders, freed ${result.freedMB.toFixed(2)} MB` +
    (result.errors.length ? `. Errors: ${result.errors.join("; ")}` : ".")
  );

  return NextResponse.json(result);
}
