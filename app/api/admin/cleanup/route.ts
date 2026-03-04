/**
 * POST /api/admin/cleanup
 *
 * Manually triggers abandoned-upload cleanup (same logic as the Vercel cron).
 * Deletes storage files + DB rows for orders with payment_status
 * IN ('abandoned', 'pending') older than CLEANUP_CUTOFF_MS (48 h).
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanAbandonedUploads } from "@/lib/cleanup";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
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
