import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/* ── Server-side upload validation ──────────────────────────
   Whitelist: only safe image/video MIME types are accepted.
   Max 1 image + 2 videos = 3 files total.
   File names are sanitized before storage path construction.
─────────────────────────────────────────────────────────── */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGES  = 1;
const MAX_VIDEOS  = 2;
const MAX_TOTAL   = MAX_IMAGES + MAX_VIDEOS;

/** Replace any char that isn't alphanumeric, dot, or dash with underscore */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-]/g, '_');
}

export async function POST(req: NextRequest) {
  try {
    // Receives only file metadata — no file bytes come through Vercel
    const { files } = (await req.json()) as {
      files: Array<{ name: string; type: string }>;
    };

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    /* ── Max file count ────────────────────────────────── */
    if (files.length > MAX_TOTAL) {
      return NextResponse.json(
        { error: `Too many files. Maximum is ${MAX_IMAGES} image and ${MAX_VIDEOS} videos (${MAX_TOTAL} total).` },
        { status: 400 }
      );
    }

    /* ── MIME whitelist + per-type count ──────────────── */
    let imageCount = 0;
    let videoCount = 0;
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}. Only JPG, PNG, WebP images and MP4/MOV/WebM videos are allowed.` },
          { status: 400 }
        );
      }
      if (IMAGE_TYPES.has(file.type)) {
        imageCount++;
        if (imageCount > MAX_IMAGES) {
          return NextResponse.json(
            { error: `Too many images. Only ${MAX_IMAGES} photo allowed.` },
            { status: 400 }
          );
        }
      } else {
        videoCount++;
        if (videoCount > MAX_VIDEOS) {
          return NextResponse.json(
            { error: `Too many videos. Only ${MAX_VIDEOS} video clips allowed.` },
            { status: 400 }
          );
        }
      }
    }

    const supabaseAdmin = createAdminClient();
    const signedUploads: Array<{
      signedUrl: string;
      path: string;
      publicUrl: string;
    }> = [];

    for (const file of files) {
      /* Sanitize name before using it in the storage path */
      const safeName = sanitizeFileName(file.name);
      const ext  = safeName.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Generate a signed URL so the client can upload directly to Supabase
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw new Error(
          `Failed to create signed URL for ${safeName}: ${error?.message}`
        );
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('media').getPublicUrl(path);

      signedUploads.push({ signedUrl: data.signedUrl, path, publicUrl });
    }

    return NextResponse.json({ signedUploads });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    console.error('[upload-media]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
