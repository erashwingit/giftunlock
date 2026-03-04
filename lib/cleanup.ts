/**
 * lib/cleanup.ts
 *
 * Shared cleanup utilities used by:
 *   - POST /api/admin/cleanup              (manual admin button)
 *   - GET  /api/cron/cleanup               (Vercel cron — daily midnight IST)
 *   - DELETE /api/admin/orders/[id]/media  (per-order raw media delete)
 */

import { createAdminClient } from "./supabase";
import { MEDIA_BUCKET, QUOTA_WARN_BYTES, CLEANUP_CUTOFF_MS, getOrderFolder } from "./storage-config";

/* ─── Types ──────────────────────────────────────────────── */

export interface CleanupResult {
  deletedOrders: number;
  freedBytes:    number;
  /** Derived: freedBytes / 1 MiB */
  freedMB:       number;
  errors:        string[];
  processedAt:   string;
}

export interface DeleteMediaResult {
  freedBytes: number;
  freedMB:    number;
  error?:     string;
}

/* ─── Private helpers ────────────────────────────────────── */

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Atomically decrements storage_quota.used_bytes by `bytes`.
 * Resets the admin_warned flag if usage drops back below the warn threshold.
 * Shared by cleanAbandonedUploads and deleteOrderMedia to avoid duplication.
 */
async function decrementQuota(supabase: AdminClient, bytes: number): Promise<void> {
  if (bytes <= 0) return;
  const { data: quota } = await supabase
    .from("storage_quota")
    .select("used_bytes")
    .eq("id", 1)
    .maybeSingle();

  if (!quota) return;

  const newUsed = Math.max(0, Number(quota.used_bytes) - bytes);
  await supabase
    .from("storage_quota")
    .update({
      used_bytes:   newUsed,
      admin_warned: newUsed > QUOTA_WARN_BYTES,
      updated_at:   new Date().toISOString(),
    })
    .eq("id", 1);
}

/* ─── cleanAbandonedUploads ──────────────────────────────── */

/**
 * Finds orders with payment_status IN ('abandoned', 'pending')
 * older than `olderThanMs` ms (default: CLEANUP_CUTOFF_MS = 48 h),
 * deletes their Supabase Storage files and DB rows, then decrements
 * the storage_quota counter.
 *
 * Storage removal and DB deletion are parallelised per order.
 * Safe to run multiple times (idempotent — missing files are ignored).
 */
export async function cleanAbandonedUploads(
  olderThanMs = CLEANUP_CUTOFF_MS
): Promise<CleanupResult> {
  const supabase   = createAdminClient();
  const cutoffTime = new Date(Date.now() - olderThanMs).toISOString();

  const result: CleanupResult = {
    deletedOrders: 0,
    freedBytes:    0,
    freedMB:       0,
    errors:        [],
    processedAt:   new Date().toISOString(),
  };

  /* ── Fetch eligible orders ─────────────────────────────── */
  const { data: orders, error: fetchErr } = await supabase
    .from("orders")
    .select("id, secure_slug, created_at")
    .in("payment_status", ["abandoned", "pending"])
    .lt("created_at", cutoffTime);

  if (fetchErr) {
    result.errors.push(`Fetch error: ${fetchErr.message}`);
    return result;
  }

  if (!orders?.length) return result;

  /* ── Process each order ────────────────────────────────── */
  for (const order of orders) {
    try {
      const folder = getOrderFolder(order.secure_slug);

      // List files to measure bytes freed before removal
      const { data: files } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(folder);

      const paths      = files?.map((f) => `${folder}/${f.name}`) ?? [];
      const orderBytes = files?.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0) ?? 0;

      // Parallelise storage removal and DB deletion — they are independent
      const storageOp = paths.length
        ? supabase.storage.from(MEDIA_BUCKET).remove(paths)
        : Promise.resolve({ error: null } as { error: null });

      const [{ error: rmErr }, { error: dbErr }] = await Promise.all([
        storageOp,
        supabase.from("orders").delete().eq("id", order.id),
      ]);

      if (rmErr) {
        result.errors.push(
          `Storage delete for slug ${order.secure_slug}: ${rmErr.message}`
        );
      }
      if (dbErr) {
        result.errors.push(`DB delete order ${order.id}: ${dbErr.message}`);
        continue; // don't count as deleted if DB op failed
      }

      result.freedBytes += orderBytes;
      result.deletedOrders++;
    } catch (err) {
      result.errors.push(`Unexpected error (order ${order.id}): ${String(err)}`);
    }
  }

  /* ── Update storage quota ──────────────────────────────── */
  try {
    await decrementQuota(supabase, result.freedBytes);
  } catch (err) {
    result.errors.push(`Quota update: ${String(err)}`);
  }

  result.freedMB = result.freedBytes / (1024 * 1024);
  return result;
}

/* ─── deleteOrderMedia ───────────────────────────────────── */

/**
 * Deletes all raw media files for a single fulfilled order.
 * Clears media_urls on the DB row and decrements storage_quota.
 */
export async function deleteOrderMedia(
  orderId:    string,
  secureSlug: string
): Promise<DeleteMediaResult> {
  const supabase = createAdminClient();
  const folder   = getOrderFolder(secureSlug);

  /* List files to measure size */
  const { data: files } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(folder);

  if (!files?.length) return { freedBytes: 0, freedMB: 0 };

  const paths      = files.map((f) => `${folder}/${f.name}`);
  const freedBytes = files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);

  /* Delete from storage */
  const { error: rmErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(paths);

  if (rmErr) {
    return { freedBytes: 0, freedMB: 0, error: rmErr.message };
  }

  /* Clear media_urls in DB and decrement quota — parallelise */
  await Promise.all([
    supabase.from("orders").update({ media_urls: [] }).eq("id", orderId),
    decrementQuota(supabase, freedBytes),
  ]);

  return { freedBytes, freedMB: freedBytes / (1024 * 1024) };
}
