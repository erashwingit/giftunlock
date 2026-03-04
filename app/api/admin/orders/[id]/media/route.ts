/**
 * DELETE /api/admin/orders/[id]/media
 *
 * Deletes raw media files for a single fulfilled order.
 * - Removes all files under orders/{secure_slug}/ in Supabase Storage
 * - Clears media_urls on the DB row
 * - Decrements storage_quota.used_bytes
 *
 * Auth: x-admin-secret header or ?secret= query param.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { deleteOrderMedia } from "@/lib/cleanup";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, secure_slug")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

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
