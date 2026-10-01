import { NextResponse } from "next/server";
import { DEFAULT_PRODUCTS, ProductItem } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Public endpoint that returns the catalog, merged with any custom image overrides
 * saved by admin in Supabase Storage (media/site-config/products.json).
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("media")
      .download("site-config/products.json");

    if (error || !data) {
      return NextResponse.json(DEFAULT_PRODUCTS);
    }

    const text = await data.text();
    const customMap: Record<string, string> = JSON.parse(text);

    const merged: ProductItem[] = DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      image: customMap[p.id] || p.image,
    }));

    return NextResponse.json(merged);
  } catch (err) {
    console.error("Failed to load custom products:", err);
    return NextResponse.json(DEFAULT_PRODUCTS);
  }
}
