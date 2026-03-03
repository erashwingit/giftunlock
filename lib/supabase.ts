import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Public browser-safe client */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Server-only admin client (bypasses RLS) */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/** Order row type matching the Supabase schema */
export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  product_type: "T-Shirt" | "Beer Mug" | "Hoodie" | "Cushion";
  product_size: string | null;
  tier: "QR Classic" | "NFC VIP";
  occasion: string | null;
  media_urls: string[] | null;
  secure_slug: string;
  payment_status: string;
  razorpay_order_id: string | null;
  destination_video_url: string | null;
  artistic_qr_url: string | null;
  created_at: string;
}
