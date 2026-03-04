import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";

/* ── Product base prices (₹) ────────────────────────────── */
const BASE_PRICES: Record<string, number> = {
  "T-Shirt": 899,
  "Beer Mug": 799,
  Hoodie: 1299,
  Cushion: 699,
};
const NFC_ADDON = 800;

/* ── Razorpay REST helper (no SDK needed) ───────────────── */
async function createRazorpayOrder(
  keyId: string,
  keySecret: string,
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
) {
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  return (await res.json()) as { id: string; amount: number; currency: string };
}

/**
 * POST /api/checkout
 *
 * Body: {
 *   customerName, customerPhone, shippingAddress,
 *   productType, productSize?, tier, occasion?,
 *   mediaUrls: string[],
 *   secureSlug?: string  ← client-provided slug (used when media was
 *                          pre-uploaded to /orders/{secureSlug}/…).
 *                          Falls back to a fresh generated slug if absent.
 * }
 *
 * Returns: { orderId, amount, currency, secureSlug, bypass? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      shippingAddress,
      productType,
      productSize,
      tier,
      occasion,
      mediaUrls = [],
      secureSlug: clientSlug,
    } = body as {
      customerName: string;
      customerPhone: string;
      shippingAddress: string;
      productType: string;
      productSize?: string;
      tier: string;
      occasion?: string;
      mediaUrls: string[];
      secureSlug?: string;
    };

    /* ── Validate required fields ──────────────────────── */
    if (!customerName || !customerPhone || !shippingAddress || !productType || !tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* ── Resolve secureSlug ────────────────────────────────────────────────
     * Prefer the client-provided slug so the order record matches the
     * storage path where files were already uploaded. Validate the format
     * (8 lowercase hex chars) before trusting it; fall back to generating
     * a fresh slug if it's missing or malformed.
     * ──────────────────────────────────────────────────────────────────── */
    const isValidSlug = (s: unknown): s is string =>
      typeof s === "string" && /^[a-f0-9]{8}$/.test(s);

    const secureSlug = isValidSlug(clientSlug) ? clientSlug : generateSlug(8);

    /* ── Pricing ───────────────────────────────────────── */
    const base   = BASE_PRICES[productType] ?? 899;
    const amount = tier === "NFC VIP" ? base + NFC_ADDON : base;

    const supabase = createAdminClient();

    /* ── Dev bypass when keys are placeholders ─────────── */
    const isDevBypass = process.env.RAZORPAY_KEY_ID === "rzp_test_PLACEHOLDER";
    let razorpayOrderId = `mock_${secureSlug}`;

    if (!isDevBypass) {
      const rzpOrder = await createRazorpayOrder(
        process.env.RAZORPAY_KEY_ID!,
        process.env.RAZORPAY_KEY_SECRET!,
        amount * 100,
        `gu_${secureSlug}`,
        { customerName, productType, tier }
      );
      razorpayOrderId = rzpOrder.id;
    }

    /* ── Insert into Supabase ──────────────────────────── */
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name:    customerName,
        customer_phone:   customerPhone,
        shipping_address: shippingAddress,
        product_type:     productType,
        product_size:     productSize ?? null,
        tier,
        occasion:         occasion ?? null,
        media_urls:       mediaUrls,
        secure_slug:      secureSlug,
        payment_status:   isDevBypass ? "paid" : "pending",
        razorpay_order_id: razorpayOrderId,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }

    return NextResponse.json({
      orderId:    razorpayOrderId,
      amount:     amount * 100,
      currency:   "INR",
      secureSlug,
      dbOrderId:  order.id,
      bypass:     isDevBypass,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
