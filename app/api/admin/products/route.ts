import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { DEFAULT_PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const secret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

/**
 * GET /api/admin/products
 * Returns current product list with custom image URLs
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.storage
      .from("media")
      .download("site-config/products.json");

    let customMap: Record<string, string> = {};
    if (data) {
      try {
        customMap = JSON.parse(await data.text());
      } catch {
        customMap = {};
      }
    }

    const products = DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      image: customMap[p.id] || p.image,
      defaultImage: p.image,
      isCustom: Boolean(customMap[p.id] && customMap[p.id] !== p.image),
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Admin products GET error:", err);
    return NextResponse.json({ products: DEFAULT_PRODUCTS });
  }
}

/**
 * POST /api/admin/products
 * Saves updated image mapping { [productId]: imageUrl } to Supabase Storage
 */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mapping } = body as { mapping: Record<string, string> };

    if (!mapping || typeof mapping !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const buffer = Buffer.from(JSON.stringify(mapping, null, 2), "utf-8");

    const { error } = await supabase.storage
      .from("media")
      .upload("site-config/products.json", buffer, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) {
      console.error("Failed to save product images:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Product images saved & synced" });
  } catch (err) {
    console.error("Admin products POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
