import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const secret = req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
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

  // "fulfilled" lives on order_status; all other filters use payment_status
  if (status === "fulfilled") {
    query = query.eq("order_status", "fulfilled");
  } else if (status) {
    query = query.eq("payment_status", status);
  }

  const { data: orders, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /* ── Summary stats (first page, no filter) ─────── */
  let stats = null;
  if (page === 1 && !status) {
    const { data: all } = await supabase
      .from("orders")
      .select("payment_status, tier, order_status");
    if (all) {
      stats = {
        total:     all.length,
        paid:      all.filter((o) => o.payment_status === "paid").length,
        pending:   all.filter((o) => o.payment_status === "pending").length,
        failed:    all.filter((o) => o.payment_status === "failed").length,
        nfc:       all.filter((o) => o.tier === "NFC VIP").length,
        fulfilled: all.filter((o) => o.order_status === "fulfilled").length,
      };
    }
  }

  return NextResponse.json({ orders, count, stats, page, perPage });
}
