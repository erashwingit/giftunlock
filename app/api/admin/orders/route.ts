import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/** Verify ADMIN_SECRET header or query-param */
function isAdmin(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

/**
 * GET /api/admin/orders
 * Headers: x-admin-secret: <ADMIN_SECRET>
 * Query:   ?page=1  &status=paid|pending|failed
 *
 * Returns: { orders[], count, stats, page, perPage }
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status  = searchParams.get("status") ?? "";
  const perPage = 20;
  const offset  = (page - 1) * perPage;

  const supabase = createAdminClient();

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status) query = query.eq("payment_status", status);

  const { data: orders, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /* ── Summary stats (first page, no filter) ─────── */
  let stats = null;
  if (page === 1 && !status) {
    const { data: all } = await supabase
      .from("orders")
      .select("payment_status, tier");
    if (all) {
      stats = {
        total:   all.length,
        paid:    all.filter((o) => o.payment_status === "paid").length,
        pending: all.filter((o) => o.payment_status === "pending").length,
        failed:  all.filter((o) => o.payment_status === "failed").length,
        nfc:     all.filter((o) => o.tier === "NFC VIP").length,
      };
    }
  }

  return NextResponse.json({ orders, count, stats, page, perPage });
}
