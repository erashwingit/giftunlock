import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, timingSafeEqual, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;

  const headerSecret = req.headers.get("x-admin-secret");
  const envSecret    = process.env.ADMIN_SECRET;
  if (!headerSecret || !envSecret) return false;

  return timingSafeEqual(headerSecret, envSecret);
}

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/promos/[id]
 * Allowed fields: code, type, value, max_uses, active
 */
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body   = (await req.json()) as Record<string, unknown>;

  const ALLOWED = ["code", "type", "value", "max_uses", "active"] as const;
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }
  // Normalise code to uppercase
  if (updates.code && typeof updates.code === "string") {
    updates.code = updates.code.toUpperCase().trim();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/promos/[id]
 * Deletes a promo code.
 */
export async function DELETE(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
