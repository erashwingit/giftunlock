import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendFollowUpEmail } from "@/lib/email";

/**
 * GET /api/cron/followup
 * Scheduled by Vercel Cron (vercel.json) — runs daily.
 * Finds orders fulfilled ~3 days ago with followup_sent=false
 * and sends a review-request email (Email C).
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  /* ── Auth: require matching CRON_SECRET header ───────── */
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  /* Orders fulfilled 3±0.5 days ago, not yet emailed */
  const from = new Date(Date.now() - 3.5 * 86_400_000).toISOString();
  const to   = new Date(Date.now() - 2.5 * 86_400_000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, product_type, secure_slug")
    .eq("order_status", "fulfilled")
    .eq("followup_sent", false)
    .gte("fulfilled_at", from)
    .lte("fulfilled_at", to)
    .not("customer_email", "is", null);

  if (error) {
    console.error("Cron followup query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const order of orders ?? []) {
    try {
      await sendFollowUpEmail({
        to:           order.customer_email,
        customerName: order.customer_name,
        productType:  order.product_type,
        secureSlug:   order.secure_slug,
      });

      /* Mark as sent */
      await supabase
        .from("orders")
        .update({ followup_sent: true })
        .eq("id", order.id);

      sent++;
    } catch (e) {
      console.error("Follow-up email failed for order", order.id, e);
    }
  }

  return NextResponse.json({ processed: orders?.length ?? 0, sent });
}
