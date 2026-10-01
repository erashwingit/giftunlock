import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * GET /api/order-status?slug=xxx OR /api/order-status?phone=xxx
 * Returns minimal, non-PII order status for the processing-page poller and /track page.
 * Public endpoint — customer_name intentionally excluded (GDPR/DPDP data minimisation).
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!slug && !phone) {
    return NextResponse.json({ error: "slug or phone required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (slug) {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_status, product_type, tier, secure_slug, created_at, order_status, tracking_number, courier_name")
      .eq("secure_slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  if (phone) {
    const { data, error } = await supabase
      .from("orders")
      .select("payment_status, product_type, tier, secure_slug, created_at, order_status, tracking_number, courier_name")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
