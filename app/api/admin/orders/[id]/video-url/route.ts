import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, timingSafeEqual, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/orders/[id]/video-url
 * Updates destination_video_url for an order, activating the /play/[slug] link.
 *
 * Body: { video_url: string }
 * Returns: { ok: true }
 *
 * Requires valid admin cookie. Query-param secret fallback has been removed
 * to prevent ADMIN_SECRET from appearing in server/proxy/CDN logs.
 */

/** Cookie-only auth with timing-safe header fallback for server-to-server calls */
async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;

  const headerSecret = req.headers.get("x-admin-secret");
  const envSecret    = process.env.ADMIN_SECRET;
  if (!headerSecret || !envSecret) return false;

  return timingSafeEqual(headerSecret, envSecret);
}

/**
 * Validates that a URL is a legitimate YouTube video URL.
 * Accepts: youtube.com/watch?v=ID and youtu.be/ID formats.
 * Rejects: javascript:, data:, internal network URLs, or arbitrary strings.
 */
function isValidYouTubeUrl(url: string): boolean {
  return /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w\-]{11}/.test(url);
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { video_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const videoUrl = (body.video_url ?? "").trim();

  if (!videoUrl) {
    return NextResponse.json({ error: "video_url is required" }, { status: 400 });
  }

  if (!isValidYouTubeUrl(videoUrl)) {
    return NextResponse.json(
      { error: "video_url must be a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)" },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ destination_video_url: videoUrl })
    .eq("id", id);

  if (error) {
    console.error("video-url update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
