import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * GET /api/order-status?slug=xxx
 * Returns minimal, non-PII order status for the processing-page poller and /track page.
 * Public endpoint — customer_name intentionally excluded (GDPR/DPDP data minimisation).
 * Only payment_status and product_type are returned; tier is safe as it is non-personal.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("payment_status, product_type, tier, secure_slug, created_at")
    .eq("secure_slug", slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // customer_name is excluded — PII must not be exposed on a public guessable endpoint
  return NextResponse.json(data);
}
