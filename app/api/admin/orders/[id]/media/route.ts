/**
 * DELETE /api/admin/orders/[id]/media
 *
 * Deletes raw media files (selfie + clips) for a single fulfilled order.
 * Use this after the destination video has been delivered to the customer.
 *
 * - Removes all files under orders/{secure_slug}/ in Supabase Storage
 * - Clears media_urls on the DB row
 * - Decrements storage_quota.used_bytes
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { deleteOrderMedia } from "@/lib/cleanup";

function isAuthed(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-admin-secret") ??
    req.nextUrl.searchParams.get("secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  /* ── Fetch order to get secureSlug ──────────────────────── */
  const supabase = createAdminClient();

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, secure_slug, payment_status, media_urls")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  /* ── Delete media ───────────────────────────────────────── */
  const result = await deleteOrderMedia(order.id, order.secure_slug);

  if (result.error) {
    console.error(`[media/delete] Order ${id}:`, result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  console.log(
    `[media/delete] Order ${id} (${order.secure_slug}) — freed ${result.freedMB.toFixed(2)} MB`
  );

  return NextResponse.json({
    success:    true,
    freedBytes: result.freedBytes,
    freedMB:    Math.round(result.freedMB * 100) / 100,
  });
}
