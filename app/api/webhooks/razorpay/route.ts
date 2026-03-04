import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/webhooks/razorpay
 * Verifies Razorpay HMAC signature and updates payment_status to 'paid'.
 * Configure this URL in Razorpay Dashboard → Webhooks:
 *   https://giftunlock.in/api/webhooks/razorpay
 * Secret: same as RAZORPAY_KEY_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";

    /* ── Verify HMAC signature ───────────────────────── */
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expected = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expected) {
      console.warn("Razorpay webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log("Razorpay webhook event:", event.event);

    /* ── Handle payment.captured ─────────────────────── */
    if (event.event === "payment.captured") {
      const orderId: string = event.payload?.payment?.entity?.order_id;

      if (orderId) {
        const supabase = createAdminClient();

        /* Idempotency: skip update if order is already paid */
        const { data: existing } = await supabase
          .from("orders")
          .select("payment_status")
          .eq("razorpay_order_id", orderId)
          .single();

        if (existing?.payment_status === "paid") {
          console.log("Order already paid (idempotent skip):", orderId);
        } else {
          const { error } = await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("razorpay_order_id", orderId);

          if (error) console.error("DB update error:", error);
          else console.log("Order marked paid:", orderId);
        }
      }
    }

    /* ── Handle payment.failed ───────────────────────── */
    if (event.event === "payment.failed") {
      const orderId: string = event.payload?.payment?.entity?.order_id;
      if (orderId) {
        const supabase = createAdminClient();

        /* Idempotency: skip update if order is already paid (don't overwrite) */
        const { data: existing } = await supabase
          .from("orders")
          .select("payment_status")
          .eq("razorpay_order_id", orderId)
          .single();

        if (existing?.payment_status !== "paid") {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("razorpay_order_id", orderId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
