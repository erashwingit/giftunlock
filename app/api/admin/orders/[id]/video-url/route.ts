import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

/**
 * PATCH /api/admin/orders/[id]/video-url
 * Updates destination_video_url for an order, activating the /play/[slug] link.
 *
 * Body: { video_url: string }
 * Returns: { ok: true }
 *
 * Requires valid admin cookie.
 */

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret =
    req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret");
  return !!process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET;
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
