import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function isAdmin(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

interface Props {
  params: Promise<{ id: string }>;
}

const ALLOWED_FIELDS = [
  "destination_video_url",
  "artistic_qr_url",
  "payment_status",
] as const;

/**
 * GET /api/admin/orders/[id]
 * Fetch a single order by UUID.
 */
export async function GET(req: NextRequest, { params }: Props) {
  if (!isAdmin(req)) {
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
 * Update destination_video_url, artistic_qr_url, or payment_status.
 */
export async function PATCH(req: NextRequest, { params }: Props) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
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
