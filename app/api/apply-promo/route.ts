import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { PromoResult } from "@/lib/promo";

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
    const { code, orderTotal } = (await req.json()) as {
      code: string;
      orderTotal: number;
    };

    if (!code || typeof orderTotal !== "number" || orderTotal < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

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
