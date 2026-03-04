import { NextRequest, NextResponse } from "next/server";
import { applyPromo } from "@/lib/promo";

/**
 * POST /api/apply-promo
 * Body: { code: string, orderTotal: number }
 * Returns: { valid, discountAmount, finalTotal, message }
 */
export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = (await req.json()) as { code: string; orderTotal: number };

    if (!code || typeof orderTotal !== "number" || orderTotal < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = applyPromo(code, orderTotal);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
