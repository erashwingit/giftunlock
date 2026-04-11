import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  // Accept session cookie or x-admin-secret header (query-param fallback removed — security)
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET;
}

interface Props {
  params: Promise<{ id: string }>;
}

const ALLOWED_FIELDS = [
  "destination_video_url",
  "artistic_qr_url",
  "payment_status",
  "order_status",
] as const;

/**
 * GET /api/admin/orders/[id]
 * Fetch a single order by UUID.
 */
export async function GET(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

/**
 * PATCH /api/admin/orders/[id]
 * Updatable fields: destination_video_url, artistic_qr_url, payment_status, order_status
 */
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id }   = await params;
  const body     = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
