import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";

/* ── Product base prices (₹) ────────────────────────────── */
const BASE_PRICES: Record<string, number> = {
  "T-Shirt":      899,
  "Beer Mug":     799,
  Cushion:        699,
  "Coffee Mug":   699,
  "Water Bottle": 899,
  "Face Mask":    499,
};
const NFC_ADDON = 800;

/* ── Razorpay REST helper (no SDK needed) ───────────────── */
async function createRazorpayOrder(
  keyId:       string,
  keySecret:   string,
  amountPaise: number,
  receipt:     string,
  notes:       Record<string, string>
) {
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
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

/**
 * Validate a promo code against the Supabase promo_codes table.
 * Returns promo row if valid, null otherwise.
 */
async function validatePromoFromDB(
  supabase: ReturnType<typeof createAdminClient>,
  code: string,
  orderTotal: number
): Promise<{ id: string; type: "flat" | "percent"; value: number; discount: number; finalTotal: number } | null> {
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (error || !promo || !promo.active) return null;
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) return null;

  const discount =
    promo.type === "flat"
      ? Math.min(promo.value, orderTotal - 1)
      : Math.floor((orderTotal * promo.value) / 100);

  const finalTotal = Math.max(1, orderTotal - discount);
  return { id: promo.id, type: promo.type, value: promo.value, discount, finalTotal };
}

/** POST /api/checkout */
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
      customerName:    string;
      customerPhone:   string;
      shippingAddress: string;
      productType:     string;
      productSize?:    string;
      tier:            string;
      occasion?:       string;
      mediaUrls:       string[];
      personalMessage?: string;
      groupMemory?:    boolean;
      groupLink?:      string;
      promoCode?:      string;
    };

    /* ── Validate ──────────────────────────────────────── */
    if (!customerName || !customerPhone || !shippingAddress || !productType || !tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    /* ── Pricing ────────────────────────────────────────── */
    const secureSlug = generateSlug(8);
    const base       = BASE_PRICES[productType] ?? 899;
    const subtotal   = tier === "NFC VIP" ? base + NFC_ADDON : base;

    const supabase = createAdminClient();

    /* ── Server-side promo verification (from DB) ───────── */
    let discountAmount = 0;
    let finalTotal     = subtotal;
    let appliedCode    = "";
    let promoId: string | null = null;

    if (promoCode) {
      const promo = await validatePromoFromDB(supabase, promoCode, subtotal);
      if (promo) {
        discountAmount = promo.discount;
        finalTotal     = promo.finalTotal;
        appliedCode    = promoCode.toUpperCase().trim();
        promoId        = promo.id;
      }
    }

    /* ── Dev bypass when keys are placeholders ─────────── */
    const isDevBypass     = process.env.RAZORPAY_KEY_ID === "rzp_test_PLACEHOLDER";
    let razorpayOrderId   = `mock_${secureSlug}`;

    if (!isDevBypass) {
      const rzpOrder = await createRazorpayOrder(
        process.env.RAZORPAY_KEY_ID!,
        process.env.RAZORPAY_KEY_SECRET!,
        finalTotal * 100,
        `gu_${secureSlug}`,
        { customerName, productType, tier }
      );
      razorpayOrderId = rzpOrder.id;
    }

    /* ── Insert order into Supabase ────────────────────── */
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        customer_name:     customerName,
        customer_phone:    customerPhone,
        shipping_address:  shippingAddress,
        product_type:      productType,
        product_size:      productSize ?? null,
        tier,
        occasion:          occasion ?? null,
        media_urls:        mediaUrls,
        personal_message:  personalMessage ?? null,
        group_memory:      groupMemory ?? false,
        group_link:        groupLink ?? null,
        promo_code:        appliedCode || null,
        discount_amount:   discountAmount || null,
        final_total:       finalTotal,
        secure_slug:       secureSlug,
        payment_status:    isDevBypass ? "paid" : "pending",
        order_status:      "pending",
        razorpay_order_id: razorpayOrderId,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", JSON.stringify(dbError));
      return NextResponse.json(
        { error: "Failed to save order", detail: dbError.message, code: dbError.code },
        { status: 500 }
      );
    }

    /* ── Increment promo used_count after order is saved ── */
    if (promoId) {
      await supabase.rpc("increment_promo_used", { promo_id: promoId });
    }

    return NextResponse.json({
      orderId:   razorpayOrderId,
      amount:    finalTotal * 100,
      currency:  "INR",
      secureSlug,
      dbOrderId: order.id,
      bypass:    isDevBypass,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
