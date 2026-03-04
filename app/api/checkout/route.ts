import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";
import { applyPromo } from "@/lib/promo";

/* ── Product base prices (₹) ────────────────────────────── */
const BASE_PRICES: Record<string, number> = {
  "T-Shirt": 899,
  "Beer Mug": 799,
  Cushion: 699,
  "Coffee Mug": 699,
  "Water Bottle": 899,
  "Face Mask": 499,
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
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }

  return (await res.json()) as { id: string; amount: number; currency: string };
}

/** POST /api/checkout
 *  Body: { customerName, customerPhone, shippingAddress, productType,
 *          productSize?, tier, occasion?, mediaUrls, personalMessage?,
 *          groupMemory?, groupLink?, promoCode? }
 *  Returns: { orderId, amount, currency, secureSlug, bypass? }
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
      personalMessage,
      groupMemory,
      groupLink,
      promoCode,
    } = body as {
      customerName: string;
      customerPhone: string;
      shippingAddress: string;
      productType: string;
      productSize?: string;
      tier: string;
      occasion?: string;
      mediaUrls: string[];
      personalMessage?: string;
      groupMemory?: boolean;
      groupLink?: string;
      promoCode?: string;
    };

    /* ── Validate ──────────────────────────────────────── */
    if (!customerName || !customerPhone || !shippingAddress || !productType || !tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* ── Slug + pricing ────────────────────────────────── */
    const secureSlug = generateSlug(8);
    const base = BASE_PRICES[productType] ?? 899;
    const subtotal = tier === "NFC VIP" ? base + NFC_ADDON : base;

    /* ── Server-side promo verification ────────────────── */
    let discountAmount = 0;
    let finalTotal     = subtotal;
    let appliedCode    = "";
    if (promoCode) {
      const promo = applyPromo(promoCode, subtotal);
      if (promo.valid) {
        discountAmount = promo.discountAmount;
        finalTotal     = promo.finalTotal;
        appliedCode    = promoCode.toUpperCase().trim();
      }
    }

    const supabase = createAdminClient();

    /* ── Dev bypass when keys are placeholders ─────────── */
    const isDevBypass = process.env.RAZORPAY_KEY_ID === "rzp_test_PLACEHOLDER";
    let razorpayOrderId = `mock_${secureSlug}`;

    if (!isDevBypass) {
      const rzpOrder = await createRazorpayOrder(
        process.env.RAZORPAY_KEY_ID!,
        process.env.RAZORPAY_KEY_SECRET!,
        finalTotal * 100,           // use discounted total for Razorpay
        `gu_${secureSlug}`,
        { customerName, productType, tier }
      );
      razorpayOrderId = rzpOrder.id;
    }

    /* ── Insert into Supabase ──────────────────────────── */
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name:      customerName,
        customer_phone:     customerPhone,
        shipping_address:   shippingAddress,
        product_type:       productType,
        product_size:       productSize ?? null,
        tier,
        occasion:           occasion ?? null,
        media_urls:         mediaUrls,
        personal_message:   personalMessage ?? null,
        group_memory:       groupMemory ?? false,
        group_link:         groupLink ?? null,
        promo_code:         appliedCode || null,
        discount_amount:    discountAmount || null,
        final_total:        finalTotal,
        secure_slug:        secureSlug,
        payment_status:     isDevBypass ? "paid" : "pending",
        razorpay_order_id:  razorpayOrderId,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }

    return NextResponse.json({
      orderId:    razorpayOrderId,
      amount:     finalTotal * 100,
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
