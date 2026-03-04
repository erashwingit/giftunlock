import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/webhooks/razorpay
 *
 * Verifies Razorpay HMAC-SHA256 signature then updates order status:
 *   payment.captured → 'paid'      (files permanent, never auto-cleaned)
 *   payment.failed   → 'abandoned' (eligible for cleanup after 48 h)
 *
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL:    https://giftunlock.in/api/webhooks/razorpay
 *   Secret: same value as RAZORPAY_KEY_SECRET env var
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    /* ── 1. Verify HMAC signature ────────────────────────── */
    const secret   = process.env.RAZORPAY_KEY_SECRET!;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

    if (signature !== expected) {
      console.warn("[webhook] Invalid Razorpay signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: { payment?: { entity?: { order_id?: string } } };
    };

    console.log("[webhook] Razorpay event:", event.event);

    const supabase = createAdminClient();
    const orderId  = event.payload?.payment?.entity?.order_id;

    /* ── 2. payment.captured → paid (files are permanent) ── */
    if (event.event === "payment.captured" && orderId) {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("razorpay_order_id", orderId);

      if (error) console.error("[webhook] DB update paid error:", error);
      else       console.log("[webhook] Order marked paid:", orderId);
    }

    /* ── 3. payment.failed → abandoned (eligible for cleanup) ─ */
    if (event.event === "payment.failed" && orderId) {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "abandoned" })
        .eq("razorpay_order_id", orderId);

      if (error) console.error("[webhook] DB update abandoned error:", error);
      else       console.log("[webhook] Order marked abandoned (cleanup eligible):", orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
