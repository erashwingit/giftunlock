import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET;
}

interface Props { params: Promise<{ id: string }> }

const ALLOWED = ["code", "type", "value", "max_uses", "active"] as const;

/** PATCH /api/admin/promos/[id] */
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body   = (await req.json()) as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED) {
    if (field in body) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  // Validate value bounds if provided
  if ("value" in updates) {
    const v = Number(updates.value);
    if (!Number.isInteger(v) || v < 1) return NextResponse.json({ error: "value must be a positive integer" }, { status: 400 });
  }
  if (typeof updates.code === "string") updates.code = updates.code.toUpperCase().trim();

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("promo_codes").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void auditLog("promo_update", req, { id, updates });
  return NextResponse.json(data);
}

/** DELETE /api/admin/promos/[id] */
export async function DELETE(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void auditLog("promo_delete", req, { id });
  return NextResponse.json({ ok: true });
}
