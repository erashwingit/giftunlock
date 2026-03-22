import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { sendOrderFulfilledEmail } from "@/lib/email";

async function isAdmin(req: NextRequest): Promise<boolean> {
  // Accept session cookie or legacy x-admin-secret header
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret = req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret");
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

  /* Auto-set fulfilled_at when transitioning to fulfilled */
  if (updates.order_status === "fulfilled") {
    updates.fulfilled_at = new Date().toISOString();
  }

  const supabase = createAdminClient();

  /* Fetch current order to send email if needed */
  const { data: current } = await supabase
    .from("orders")
    .select("order_status, customer_email, customer_name, product_type, tier, secure_slug")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /* Send fulfilled email if transitioning to fulfilled and customer has email */
  if (
    updates.order_status === "fulfilled" &&
    current?.order_status !== "fulfilled" &&
    current?.customer_email
  ) {
    sendOrderFulfilledEmail({
      to:          current.customer_email,
      customerName: current.customer_name,
      productType:  current.product_type,
      tier:         current.tier,
      secureSlug:   current.secure_slug,
    }).catch((e) => console.error("Fulfilled email failed:", e));
  }

  return NextResponse.json(data);
}
