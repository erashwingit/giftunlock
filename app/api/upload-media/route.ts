import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/** Allowed MIME type prefixes for customer media uploads */
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];

/** Max files per request to prevent abuse */
const MAX_FILES = 20;

export async function POST(req: NextRequest) {
  try {
    // Receives only file metadata — no file bytes come through Next.js/Vercel
    const { files } = (await req.json()) as {
      files: Array<{ name: string; type: string }>;
    };

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} per request.` },
        { status: 400 }
      );
    }

    // Validate MIME types — reject anything that isn't image/* or video/*
    for (const file of files) {
      const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
        file.type.startsWith(prefix)
      );
      if (!allowed) {
        return NextResponse.json(
          { error: `File type not allowed: ${file.type}. Only images and videos are accepted.` },
          { status: 422 }
        );
      }
    }

    const supabaseAdmin = createAdminClient();
    const signedUploads: Array<{
      signedUrl: string;
      path: string;
      publicUrl: string;
    }> = [];

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Generate a signed URL so the client can upload directly to Supabase
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw new Error(
          `Failed to create signed URL for ${file.name}: ${error?.message}`
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
