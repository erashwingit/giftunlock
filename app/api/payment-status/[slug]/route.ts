import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * GET /api/payment-status/[slug]
 * Public endpoint polled by PaymentProcessingView to check if payment was confirmed.
 * Returns minimal data — no sensitive order details exposed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || slug.length < 4) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("payment_status, destination_video_url")
    .eq("secure_slug", slug.toLowerCase())
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      payment_status:       order.payment_status,
      has_video:            !!order.destination_video_url,
    },
    {
      headers: {
        // No caching — always fresh
        "Cache-Control": "no-store",
      },
    }
  );
}
