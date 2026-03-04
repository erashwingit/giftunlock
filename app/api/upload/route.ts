/**
 * app/api/upload/route.ts
 *
 * POST /api/upload   — Upload a single file (selfie or clip) to Supabase Storage.
 * DELETE /api/upload — Remove a previously uploaded file by slot + secureSlug.
 *
 * Security layers (in order):
 *   1. File size check (≤ 50 MB)
 *   2. Extension block-list check (client-bypass prevention)
 *   3. Double-extension check (e.g. evil.php.jpg)
 *   4. Magic-bytes MIME check via file-type (cannot be spoofed client-side)
 *   5. Storage quota guard (1 GB hard limit, 900 MB admin warning)
 *   6. EXIF strip for images via sharp (privacy protection)
 *   7. Upload via service_role (bypasses RLS) to private bucket
 *   8. Return 1-hour signed URL for immediate use
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import {
  MEDIA_BUCKET,
  MAX_FILE_BYTES,
  QUOTA_MAX_BYTES,
  QUOTA_WARN_BYTES,
  SELFIE_MIME,
  CLIP_MIME,
  isBlockedExtension,
  hasDoubleExtension,
  isSelfieSlot,
  slotToFilename,
  type FileSlot,
} from "@/lib/storage-config";

// Force Node.js runtime — required for sharp and file-type (no Edge support)
export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Parse multipart form ─────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form data" },
        { status: 400 }
      );
    }

    const file       = formData.get("file")        as File | null;
    const slot       = formData.get("slot")        as FileSlot | null;
    const secureSlug = formData.get("secureSlug")  as string | null;

    // ── 1. Presence validation ────────────────────────────────────────────────
    if (!file || !slot || !secureSlug) {
      return NextResponse.json(
        { error: "Missing required fields: file, slot, secureSlug" },
        { status: 400 }
      );
    }

    const VALID_SLOTS: FileSlot[] = ["selfie", "clip1", "clip2", "clip3"];
    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json(
        { error: `Invalid slot "${slot}". Must be one of: ${VALID_SLOTS.join(", ")}` },
        { status: 400 }
      );
    }

    // secureSlug must be exactly 8 lowercase hex chars (4 random bytes)
    if (!/^[a-f0-9]{8}$/.test(secureSlug)) {
      return NextResponse.json(
        { error: "Invalid secureSlug format" },
        { status: 400 }
      );
    }

    // ── 2. File size check ────────────────────────────────────────────────────
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds 50 MB limit (received ${(file.size / 1_048_576).toFixed(1)} MB)`,
        },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file not allowed" }, { status: 400 });
    }

    // ── 3. Extension checks ───────────────────────────────────────────────────
    const originalName = file.name.toLowerCase().trim();

    if (isBlockedExtension(originalName)) {
      const ext = originalName.slice(originalName.lastIndexOf("."));
      return NextResponse.json(
        { error: `File extension not allowed: ${ext}` },
        { status: 415 }
      );
    }

    if (hasDoubleExtension(originalName)) {
      return NextResponse.json(
        { error: `Double extensions not allowed: ${file.name}` },
        { status: 415 }
      );
    }

    // ── 4. Magic-bytes MIME check (server-side, unforgeable) ─────────────────
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import keeps file-type (ESM-only) out of the module graph at
    // build time, avoiding issues with Next.js bundling.
    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(rawBuffer);

    if (!detected) {
      return NextResponse.json(
        { error: "Could not determine file type from content" },
        { status: 415 }
      );
    }

    const isImage    = isSelfieSlot(slot);
    const allowedMime = isImage ? SELFIE_MIME : CLIP_MIME;

    if (!allowedMime.has(detected.mime)) {
      return NextResponse.json(
        {
          error: `Detected MIME type not allowed: ${detected.mime}. ` +
            (isImage
              ? "Selfie must be JPEG, PNG, or WEBP."
              : "Clips must be MP4 or MOV."),
        },
        { status: 415 }
      );
    }

    // ── 5. Quota check ────────────────────────────────────────────────────────
    const supabase = createAdminClient();

    const { data: quotaRow } = await supabase
      .from("storage_quota")
      .select("used_bytes, admin_warned")
      .eq("id", 1)
      .maybeSingle();

    if (quotaRow) {
      const currentBytes  = Number(quotaRow.used_bytes);
      const projectedBytes = currentBytes + file.size;

      if (projectedBytes > QUOTA_MAX_BYTES) {
        return NextResponse.json(
          {
            error:
              "Storage quota exceeded (1 GB). Please contact support to free up space.",
          },
          { status: 507 }
        );
      }

      // Warn admin once when approaching the 900 MB threshold
      if (projectedBytes > QUOTA_WARN_BYTES && !quotaRow.admin_warned) {
        console.warn(
          `[GiftUnlock ADMIN ALERT] Storage usage at ${(projectedBytes / 1_073_741_824).toFixed(2)} GB / 1 GB. ` +
          "Consider upgrading the Supabase plan or archiving old orders."
        );
        // Mark warned so we don't repeat the log on every upload
        await supabase
          .from("storage_quota")
          .update({ admin_warned: true, updated_at: new Date().toISOString() })
          .eq("id", 1);
      }
    }

    // ── 6. Process image: strip EXIF + re-encode as JPEG ─────────────────────
    let uploadBuffer: Buffer;
    let contentType: string;

    if (isImage) {
      // Dynamic import — sharp is a native module; keep out of Edge runtime
      const sharp = (await import("sharp")).default;

      // .rotate() applies the EXIF orientation then strips metadata (default).
      // Not calling .withMetadata() ensures ALL EXIF data is removed.
      uploadBuffer = await sharp(rawBuffer)
        .rotate()                              // correct orientation before strip
        .jpeg({ quality: 88, progressive: true })
        .toBuffer();

      contentType = "image/jpeg";
    } else {
      // Videos: upload as-is (EXIF/metadata removal needs FFmpeg, out of scope)
      uploadBuffer = rawBuffer;
      contentType  = detected.mime;
    }

    // ── 7. Upload to Supabase Storage ─────────────────────────────────────────
    // Path format: orders/{secureSlug}/selfie.jpg  |  clip1.mp4  etc.
    const filename    = slotToFilename(slot, !isImage);
    const storagePath = `orders/${secureSlug}/${filename}`;

    // Remove any existing file at this path before uploading (replace flow).
    // Ignore errors — file might not exist yet.
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, uploadBuffer, {
        contentType,
        upsert: true,        // safety net if remove() races
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("[upload] Supabase storage error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed. Please try again." },
        { status: 500 }
      );
    }

    // ── 8. Update quota tracking ──────────────────────────────────────────────
    if (quotaRow !== null) {
      const newUsed = Number(quotaRow.used_bytes) + uploadBuffer.length;
      await supabase
        .from("storage_quota")
        .update({ used_bytes: newUsed, updated_at: new Date().toISOString() })
        .eq("id", 1);
    }

    // ── 9. Generate 1-hour signed URL ─────────────────────────────────────────
    const { data: signedData, error: signedError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(storagePath, 3600); // 3600 s = 1 hour

    if (signedError || !signedData?.signedUrl) {
      console.error("[upload] Signed URL generation failed:", signedError);
      return NextResponse.json(
        { error: "Upload succeeded but could not generate access URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl:   signedData.signedUrl,
      storagePath,
      slot,
    });
  } catch (err) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/upload
// Body: { slot: FileSlot; secureSlug: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    let body: { slot: FileSlot; secureSlug: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { slot, secureSlug } = body;

    if (!slot || !secureSlug) {
      return NextResponse.json(
        { error: "Missing slot or secureSlug" },
        { status: 400 }
      );
    }

    const isImage    = isSelfieSlot(slot);
    const filename    = slotToFilename(slot, !isImage);
    const storagePath = `orders/${secureSlug}/${filename}`;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([storagePath]);

    if (error) {
      // Log but don't fail hard — the file may have already been removed
      console.warn("[upload DELETE] Remove warning:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[upload DELETE] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
