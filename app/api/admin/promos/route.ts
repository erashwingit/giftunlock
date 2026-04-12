import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, timingSafeEqual, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/**
 * Verify admin identity via session cookie or x-admin-secret header.
 * Uses timing-safe comparison for the header to prevent timing-oracle attacks.
 */
async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;

  const headerSecret = req.headers.get("x-admin-secret");
  const envSecret    = process.env.ADMIN_SECRET;
  if (!headerSecret || !envSecret) return false;

  return timingSafeEqual(headerSecret, envSecret);
}

/**
 * GET /api/admin/promos
 * Returns all promo codes, ordered by created_at desc.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST /api/admin/promos
 * Body: { code, type, value, max_uses? }
 * Creates a new promo code.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code, type, value, max_uses } = (await req.json()) as {
    code: string;
    type: "flat" | "percent";
    value: number;
    max_uses?: number | null;
  };

  if (!code || !type || typeof value !== "number" || value < 0) {
    return NextResponse.json({ error: "Invalid promo data" }, { status: 400 });
  }
  if (!["flat", "percent"].includes(type)) {
    return NextResponse.json({ error: "type must be flat or percent" }, { status: 400 });
  }
  if (type === "percent" && (value < 1 || value > 100)) {
    return NextResponse.json({ error: "Percent value must be 1-100" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      code:       code.toUpperCase().trim(),
      type,
      value,
      max_uses:   max_uses ?? null,
      used_count: 0,
      active:     true,
    })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Code already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
