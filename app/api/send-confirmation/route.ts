import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * POST /api/send-confirmation
 * Called by the order success page after payment to trigger confirmation email.
 * Uses secureSlug to look up the order — no sensitive data passed from client.
 * Idempotent: skips if email already sent (email_sent flag).
 */
export async function POST(req: NextRequest) {
  try {
    const { secureSlug } = await req.json();
    if (
      !secureSlug ||
      typeof secureSlug !== "string" ||
      !/^[a-zA-Z0-9]{6,16}$/.test(secureSlug)
    ) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("customer_email, customer_name, product_type, tier, secure_slug, payment_status, email_sent")
      .eq("secure_slug", secureSlug)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Only send if payment is paid or we're in dev bypass mode
    if (order.payment_status !== "paid") {
      return NextResponse.json({ skipped: "not paid yet" });
    }

    // Idempotency: skip if already sent
    if (order.email_sent) {
      return NextResponse.json({ skipped: "already sent" });
    }

    if (order.customer_email) {
      await sendOrderConfirmationEmail({
        to:           order.customer_email,
        customerName: order.customer_name,
        productType:  order.product_type,
        tier:         order.tier,
        secureSlug:   order.secure_slug,
      });

      // Mark email sent to avoid duplicates
      await supabase
        .from("orders")
        .update({ email_sent: true })
        .eq("secure_slug", secureSlug);
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("send-confirmation error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
