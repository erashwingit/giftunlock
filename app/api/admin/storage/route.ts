import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET;
}

const BUCKET       = "media";
const MAX_MB       = 1024;
const STALE_HOURS  = 48;

/** Recursively list all files in a Storage bucket path */
async function listAllFiles(
  supabase: ReturnType<typeof createAdminClient>,
  path = ""
): Promise<{ name: string; metadata?: { size?: number }; created_at?: string; id?: string }[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(path, {
    limit: 1000,
    sortBy: { column: "created_at", order: "asc" },
  });
  if (error || !data) return [];

  const files: { name: string; metadata?: { size?: number }; created_at?: string; id?: string }[] = [];

  for (const item of data) {
    if (item.id) {
      // It's a file (has an id)
      files.push({ ...item, name: path ? `${path}/${item.name}` : item.name });
    } else {
      // It's a folder — recurse
      const sub = await listAllFiles(supabase, path ? `${path}/${item.name}` : item.name);
      files.push(...sub);
    }
  }
  return files;
}

/**
 * GET /api/admin/storage
 * Returns total storage used in MB and file count.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const files    = await listAllFiles(supabase);

  const totalBytes = files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);
  const totalMB    = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
  const usedPct    = parseFloat(((totalMB / MAX_MB) * 100).toFixed(1));

  return NextResponse.json({
    totalMB,
    maxMB:   MAX_MB,
    usedPct: Math.min(usedPct, 100),
    count:   files.length,
  });
}

/**
 * DELETE /api/admin/storage
 * Cleans up media files uploaded >48 h ago that are NOT referenced by any paid order.
 * Returns { freed_mb, deleted_count, paths }
 */
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase   = createAdminClient();
  const files      = await listAllFiles(supabase);
  const cutoff     = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  // Collect all media URLs referenced by paid orders
  const { data: orders } = await supabase
    .from("orders")
    .select("media_urls")
    .eq("payment_status", "paid");

  const referencedUrls = new Set<string>();
  (orders ?? []).forEach((o) => {
    (o.media_urls ?? []).forEach((url: string) => {
      // Extract just the filename/path portion from the URL
      const parts = url.split(`/${BUCKET}/`);
      if (parts[1]) referencedUrls.add(parts[1]);
    });
  });

  // Identify stale, unreferenced files
  const toDelete = files.filter((f) => {
    const createdAt = f.created_at ? new Date(f.created_at) : null;
    const isStale   = createdAt ? createdAt < cutoff : false;
    return isStale && !referencedUrls.has(f.name);
  });

  if (toDelete.length === 0) {
    return NextResponse.json({ freed_mb: 0, deleted_count: 0, paths: [] });
  }

  const paths      = toDelete.map((f) => f.name);
  const freedBytes = toDelete.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    freed_mb:      parseFloat((freedBytes / (1024 * 1024)).toFixed(2)),
    deleted_count: toDelete.length,
    paths,
  });
}
