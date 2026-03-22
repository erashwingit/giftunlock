import { createClient } from "@supabase/supabase-js";

const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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
        persistSession:   false,
      },
    }
  );
}

/** Order row type matching the Supabase schema */
export interface Order {
  id:                    string;
  customer_name:         string;
  customer_email:        string | null;
  customer_phone:        string;
  shipping_address:      string;
  product_type:          string;
  product_size:          string | null;
  tier:                  "QR Classic" | "NFC VIP";
  occasion:              string | null;
  media_urls:            string[] | null;
  personal_message:      string | null;
  group_memory:          boolean;
  group_link:            string | null;
  promo_code:            string | null;
  discount_amount:       number | null;
  final_total:           number | null;
  secure_slug:           string;
  payment_status:        string;
  order_status:          "pending" | "processing" | "fulfilled" | null;
  razorpay_order_id:     string | null;
  destination_video_url: string | null;
  artistic_qr_url:       string | null;
  fulfilled_at:          string | null;
  followup_sent:         boolean;
  created_at:            string;
}

/** Promo code row type matching the promo_codes table */
export interface PromoCode {
  id:         string;
  code:       string;
  type:       "flat" | "percent";
  value:      number;
  max_uses:   number | null;
  used_count: number;
  active:     boolean;
  created_at: string;
}
