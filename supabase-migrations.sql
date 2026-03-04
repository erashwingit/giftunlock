-- ============================================================
-- GiftUnlock.in — Supabase Migrations
-- Run these in the Supabase SQL editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. promo_codes table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT        UNIQUE NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('flat', 'percent')),
  value       INTEGER     NOT NULL CHECK (value > 0),
  max_uses    INTEGER,                          -- NULL = unlimited
  used_count  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with existing hardcoded promo codes
INSERT INTO promo_codes (code, type, value, max_uses, used_count, active)
VALUES
  ('FIRST100', 'flat',    100, NULL, 0, true),
  ('HOLI2026', 'percent',  15, NULL, 0, true),
  ('SQUAD10',  'percent',  10, NULL, 0, true),
  ('GIFTNOW',  'flat',     50, NULL, 0, true)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Add order_status column to orders table
-- ------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_status TEXT
    DEFAULT 'pending'
    CHECK (order_status IN ('pending', 'processing', 'fulfilled'));

-- ------------------------------------------------------------
-- 3. RPC helper: atomically increment promo used_count
--    Called by /api/checkout after a successful order insert.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_promo_used(promo_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE promo_codes
     SET used_count = used_count + 1
   WHERE id = promo_id;
END;
$$;

-- ------------------------------------------------------------
-- 4. (Optional) RLS policies for promo_codes
--    Service-role key bypasses RLS, so these are informational.
-- ------------------------------------------------------------
-- ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "service role only" ON promo_codes
--   USING (auth.role() = 'service_role');
