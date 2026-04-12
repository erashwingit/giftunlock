import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase";
import type { PromoResult } from "@/lib/promo";

/** Zod schema — validate and sanitise promo application input */
const ApplyPromoSchema = z.object({
  code:       z.string().min(1).max(50).trim(),
  // Order total in ₹; must be a positive integer
  orderTotal: z.number().int().positive().max(1_000_000),
});

/**
 * POST /api/apply-promo
 * Body: { code: string, orderTotal: number }
 * Returns: { valid, discountAmount, finalTotal, message }
 *
 * Reads promo codes from the Supabase `promo_codes` table.
 * Validates active status and usage limits but does NOT increment used_count here
 * — that happens at checkout when the order is confirmed.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    const parsed = ApplyPromoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { code, orderTotal } = parsed.data;

    const supabase = createAdminClient();
    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    const invalid: PromoResult = {
      valid:          false,
      discountAmount: 0,
      finalTotal:     orderTotal,
      message:        "Invalid or expired code",
    };

    if (error || !promo) return NextResponse.json(invalid);

    if (!promo.active) {
      return NextResponse.json({ ...invalid, message: "This promo code is inactive" });
    }

    if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ ...invalid, message: "This promo code has reached its usage limit" });
    }

    // Calculate discount
    const discount =
      promo.type === "flat"
        ? Math.min(promo.value, orderTotal - 1)
        : Math.floor((orderTotal * promo.value) / 100);

    const finalTotal = Math.max(1, orderTotal - discount);

    const result: PromoResult = {
      valid:          true,
      discountAmount: discount,
      finalTotal,
      message:        `${promo.code} applied! You save ₹${discount}.`,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
