/** Shared promo-code logic — used by /api/apply-promo and /api/checkout */

export interface PromoResult {
  valid: boolean;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

export function applyPromo(promo: { type: "flat" | "percent"; value: number } | null, code: string, orderTotal: number): PromoResult {
  if (!promo) {
    return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: "Invalid or expired code" };
  }

  const discount =
    promo.type === "flat"
      ? Math.min(promo.value, orderTotal - 1)          // never drop below ₹1
      : Math.floor((orderTotal * promo.value) / 100);

  const finalTotal = Math.max(1, orderTotal - discount);

  return {
    valid: true,
    discountAmount: discount,
    finalTotal,
    message: `${code.toUpperCase()} applied! You save ₹${discount}.`,
  };
}
