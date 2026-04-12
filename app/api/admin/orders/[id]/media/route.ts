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

const BUCKET = "media";

/**
 * DELETE /api/admin/orders/[id]/media
 * Deletes raw media files from Supabase Storage for a given order
 * and clears the media_urls column.
 */
export async function DELETE(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id }   = await params;
  const supabase = createAdminClient();

  // Fetch the order's media URLs
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("id, media_urls")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const urls: string[] = order.media_urls ?? [];
  if (urls.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  // Convert public URLs to storage paths (strip everything up to /<bucket>/)
  const paths = urls
    .map((url) => {
      const marker = `/${BUCKET}/`;
      const idx    = url.indexOf(marker);
      return idx >= 0 ? url.slice(idx + marker.length) : null;
    })
    .filter(Boolean) as string[];

  if (paths.length > 0) {
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageErr) {
      return NextResponse.json({ error: storageErr.message }, { status: 500 });
    }
  }

  // Clear media_urls on the order record
  await supabase.from("orders").update({ media_urls: [] }).eq("id", id);

  return NextResponse.json({ ok: true, deleted: paths.length });
}
