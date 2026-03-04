/**
 * lib/cleanup.ts
 *
 * Shared cleanup utilities used by:
 *   - POST /api/admin/cleanup   (manual admin button)
 *   - GET  /api/cron/cleanup    (Vercel cron — daily midnight IST)
 *   - DELETE /api/admin/orders/[id]/media  (per-order raw media delete)
 */

import { createAdminClient } from "./supabase";
import { MEDIA_BUCKET, QUOTA_WARN_BYTES } from "./storage-config";

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

/* ─── cleanAbandonedUploads ──────────────────────────────── */

/**
 * Finds orders with payment_status IN ('abandoned', 'pending')
 * that are older than `olderThanMs` milliseconds (default 48 h),
 * deletes their Supabase Storage files, purges the DB row, and
 * decrements the storage_quota.used_bytes counter.
 *
 * Safe to run multiple times (idempotent — missing files are ignored).
 */
export async function cleanAbandonedUploads(
  olderThanMs = 48 * 60 * 60 * 1000
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
      const folder = `orders/${order.secure_slug}`;

      // List actual files to measure bytes freed
      const { data: files } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(folder);

      let orderBytes = 0;

      if (files?.length) {
        const paths   = files.map((f) => `${folder}/${f.name}`);
        orderBytes    = files.reduce((sum, f) => sum + (f.metadata?.size ?? 0), 0);

        const { error: rmErr } = await supabase.storage
          .from(MEDIA_BUCKET)
          .remove(paths);

        if (rmErr) {
          // Log but don't abort — partial deletes are acceptable
          result.errors.push(
            `Storage delete for slug ${order.secure_slug}: ${rmErr.message}`
          );
        }
      }

      // Remove the DB row
      const { error: dbErr } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

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

  /* ── Update storage_quota ──────────────────────────────── */
  if (result.freedBytes > 0) {
    try {
      const { data: quota } = await supabase
        .from("storage_quota")
        .select("used_bytes")
        .eq("id", 1)
        .maybeSingle();

      if (quota) {
        const newUsed = Math.max(0, Number(quota.used_bytes) - result.freedBytes);
        await supabase
          .from("storage_quota")
          .update({
            used_bytes:   newUsed,
            admin_warned: newUsed > QUOTA_WARN_BYTES,
            updated_at:   new Date().toISOString(),
          })
          .eq("id", 1);
      }
    } catch (err) {
      result.errors.push(`Quota update: ${String(err)}`);
    }
  }

  result.freedMB = result.freedBytes / (1024 * 1024);
  return result;
}

/* ─── deleteOrderMedia ───────────────────────────────────── */

/**
 * Deletes all raw media files for a single order (selfie + clips).
 * Clears media_urls on the DB row and decrements storage_quota.
 *
 * Intended for use after an order has been fulfilled (video delivered).
 */
export async function deleteOrderMedia(
  orderId:    string,
  secureSlug: string
): Promise<DeleteMediaResult> {
  const supabase = createAdminClient();
  const folder   = `orders/${secureSlug}`;

  /* List and measure */
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

  /* Clear media_urls in the DB row */
  await supabase
    .from("orders")
    .update({ media_urls: [] })
    .eq("id", orderId);

  /* Decrement quota */
  if (freedBytes > 0) {
    const { data: quota } = await supabase
      .from("storage_quota")
      .select("used_bytes")
      .eq("id", 1)
      .maybeSingle();

    if (quota) {
      const newUsed = Math.max(0, Number(quota.used_bytes) - freedBytes);
      await supabase
        .from("storage_quota")
        .update({
          used_bytes:   newUsed,
          admin_warned: newUsed > QUOTA_WARN_BYTES,
          updated_at:   new Date().toISOString(),
        })
        .eq("id", 1);
    }
  }

  return { freedBytes, freedMB: freedBytes / (1024 * 1024) };
}
