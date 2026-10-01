import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * GET /api/reviews
 * Returns recent reviews for the homepage and product displays.
 */
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, product_type, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    // If table doesn't exist yet or query fails, return empty array safely
    return NextResponse.json({ reviews: [] });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

/**
 * POST /api/reviews
 * Submits a new customer reaction / review.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, rating, comment, product_type, order_slug } = body;

    if (!customer_name || !rating || !comment) {
      return NextResponse.json(
        { error: "Name, rating, and comment are required" },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        customer_name: customer_name.trim(),
        rating: ratingNum,
        comment: comment.trim(),
        product_type: product_type || null,
        order_slug: order_slug || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
