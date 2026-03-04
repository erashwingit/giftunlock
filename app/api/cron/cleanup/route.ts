/**
 * GET /api/cron/cleanup
 *
 * Vercel Cron Job handler — runs daily at 00:00 IST (18:00 UTC).
 * Schedule defined in vercel.json: "0 18 * * *"
 *
 * Vercel automatically sends:
 *   Authorization: Bearer {CRON_SECRET}
 * when CRON_SECRET is set in project environment variables.
 *
 * Also accepts GET from the admin panel via x-admin-secret header
 * (useful for manual testing without Vercel infrastructure).
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanAbandonedUploads } from "@/lib/cleanup";

export async function GET(req: NextRequest) {
  /* ── Auth: Vercel cron token OR admin secret ─────────────── */
  const authHeader  = req.headers.get("authorization");
  const adminSecret = req.headers.get("x-admin-secret");

  const cronAuthed =
    process.env.CRON_SECRET
      ? authHeader === `Bearer ${process.env.CRON_SECRET}`
      : true; // no secret configured → open (dev only)

  const adminAuthed =
    adminSecret && adminSecret === process.env.ADMIN_SECRET;

  if (!cronAuthed && !adminAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ── Run cleanup ─────────────────────────────────────────── */
  const result = await cleanAbandonedUploads();

  const msg =
    `[cron/cleanup] ${result.processedAt} — ` +
    `Deleted ${result.deletedOrders} orders, freed ${result.freedMB.toFixed(2)} MB` +
    (result.errors.length ? `. Errors: ${result.errors.join("; ")}` : ". No errors.");

  console.log(msg);

  return NextResponse.json({ ok: true, ...result });
}
