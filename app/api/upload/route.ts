import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/upload
 * Accepts multipart/form-data with one or more "files" fields.
 * Uploads each file to Supabase Storage using the SERVICE_ROLE key
 * (server-side only — bypasses RLS and avoids browser CORS issues).
 * Returns: { urls: string[] }
 */

const MAX_SELFIE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES  = 50 * 1024 * 1024;  // 50 MB
const MAX_VIDEOS       = 2;

// Allow up to 60s for large video uploads on Vercel
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    /* ── Pre-flight validation ───────────────────────── */
    const videos = files.filter(f => f.type.startsWith("video/"));
    if (videos.length > MAX_VIDEOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VIDEOS} video clips allowed` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const urls: string[] = [];

    for (const file of files) {
      const isPhoto = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      /* ── Per-type size guard ─────────────────────────── */
      if (isPhoto && file.size > MAX_SELFIE_BYTES) {
        return NextResponse.json(
          { error: `Selfie "${file.name}" must be under 10 MB (phone photos are usually 2–5 MB)` },
          { status: 413 }
        );
      }
      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json(
          { error: `Video "${file.name}" exceeds the 50 MB limit` },
          { status: 413 }
        );
      }
      if (!isPhoto && !isVideo) {
        return NextResponse.json(
          { error: `"${file.name}" is not a supported file type` },
          { status: 400 }
        );
      }

      /* ── Unique storage path ────────────────────────── */
      const ext  = file.name.split(".").pop() ?? "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      /* ── Upload via service-role client ─────────────── */
      const buffer = Buffer.from(await file.arrayBuffer());
      const { data, error } = await supabase.storage
        .from("media")
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (error) {
        return NextResponse.json(
          { error: `Upload failed for ${file.name}: ${error.message}` },
          { status: 500 }
        );
      }

      /* ── Get public URL ─────────────────────────────── */
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

      urls.push(publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("[/api/upload] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
