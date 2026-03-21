import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Only receives file metadata (name + type) — no file bytes come through Vercel
    const { files } = (await req.json()) as {
      files: Array<{ name: string; type: string }>;
    };

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const signedUploads: Array<{ signedUrl: string; path: string; publicUrl: string }> = [];

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Generate a signed URL so the client can upload directly to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw new Error(`Failed to create signed URL for ${file.name}: ${error?.message}`);
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
