/**
 * GET /api/admin/storage
 *
 * Returns current storage usage and cleanup eligibility stats.
 * Reads from the storage_quota table (maintained by upload + cleanup ops).
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { QUOTA_MAX_BYTES, QUOTA_WARN_BYTES } from "@/lib/storage-config";

function isAuthed(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  /* ── Storage quota row ────────────────────────────────── */
  const { data: quota } = await supabase
    .from("storage_quota")
    .select("used_bytes, admin_warned, updated_at")
    .eq("id", 1)
    .maybeSingle();

  const usedBytes  = Number(quota?.used_bytes ?? 0);
  const usedMB     = usedBytes / (1024 * 1024);
  const maxMB      = QUOTA_MAX_BYTES / (1024 * 1024);
  const warnMB     = QUOTA_WARN_BYTES / (1024 * 1024);
  const usedPct    = (usedBytes / QUOTA_MAX_BYTES) * 100;

  /* ── Cleanup-eligible orders (abandoned or pending > 48 h) */
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { count: cleanupEligibleCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("payment_status", ["abandoned", "pending"])
    .lt("created_at", cutoff);

  /* ── Total abandoned orders (any age) ─────────────────── */
  const { count: totalAbandoned } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "abandoned");

  return NextResponse.json({
    usedBytes,
    usedMB:               Math.round(usedMB    * 100) / 100,
    maxMB:                Math.round(maxMB),
    warnMB:               Math.round(warnMB),
    maxBytes:             QUOTA_MAX_BYTES,
    warnBytes:            QUOTA_WARN_BYTES,
    usedPercent:          Math.round(usedPct   * 10)  / 10,
    adminWarned:          quota?.admin_warned  ?? false,
    lastUpdated:          quota?.updated_at    ?? null,
    cleanupEligibleCount: cleanupEligibleCount ?? 0,
    totalAbandoned:       totalAbandoned        ?? 0,
  });
}
