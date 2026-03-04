/**
 * GET /api/admin/storage
 *
 * Returns current storage usage and cleanup eligibility stats.
 * Reads from the storage_quota table (maintained by upload + cleanup ops).
 * All three DB queries run in parallel via Promise.all.
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { QUOTA_MAX_BYTES, QUOTA_WARN_BYTES, CLEANUP_CUTOFF_MS } from "@/lib/storage-config";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff   = new Date(Date.now() - CLEANUP_CUTOFF_MS).toISOString();

  /* ── Run all three queries in parallel ────────────────── */
  const [
    { data: quota },
    { count: cleanupEligibleCount },
    { count: totalAbandoned },
  ] = await Promise.all([
    supabase
      .from("storage_quota")
      .select("used_bytes, admin_warned, updated_at")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["abandoned", "pending"])
      .lt("created_at", cutoff),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "abandoned"),
  ]);

  const usedBytes = Number(quota?.used_bytes ?? 0);
  const usedMB    = usedBytes / (1024 * 1024);
  const maxMB     = QUOTA_MAX_BYTES / (1024 * 1024);
  const warnMB    = QUOTA_WARN_BYTES / (1024 * 1024);
  const usedPct   = (usedBytes / QUOTA_MAX_BYTES) * 100;

  return NextResponse.json({
    usedBytes,
    usedMB:               Math.round(usedMB  * 100) / 100,
    maxMB:                Math.round(maxMB),
    warnMB:               Math.round(warnMB),
    maxBytes:             QUOTA_MAX_BYTES,
    warnBytes:            QUOTA_WARN_BYTES,
    usedPercent:          Math.round(usedPct * 10)  / 10,
    adminWarned:          quota?.admin_warned  ?? false,
    lastUpdated:          quota?.updated_at    ?? null,
    cleanupEligibleCount: cleanupEligibleCount ?? 0,
    totalAbandoned:       totalAbandoned        ?? 0,
  });
}
