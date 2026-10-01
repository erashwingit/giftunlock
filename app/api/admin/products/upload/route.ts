import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const secret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

/**
 * POST /api/admin/products/upload
 * Multipart form upload for a product photo.
 * Stores in Supabase 'media' bucket under products/
 * Returns public URL.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;

    if (!file || !productId) {
      return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanId = productId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const filePath = `products/${cleanId}-${Date.now()}.${ext}`;

    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (err) {
    console.error("Admin product upload error:", err);
    return NextResponse.json({ error: "Internal upload failure" }, { status: 500 });
  }
}
