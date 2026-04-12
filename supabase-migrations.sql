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
-- 4. RLS policies — restrict direct table access
--    The application uses the service-role key (bypasses RLS) from
--    server-side API routes only. RLS acts as a defence-in-depth layer
--    to block any accidental anon/authenticated key exposure.
-- ------------------------------------------------------------

-- promo_codes: only the service role may read or write
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role only — promo_codes" ON promo_codes;
CREATE POLICY "service role only — promo_codes" ON promo_codes
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- orders: only the service role may read or write
-- NOTE: if you add Supabase Auth user sign-in in future, update these
--       policies to allow auth.uid() = user_id for user-owned rows.
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role only — orders" ON orders;
CREATE POLICY "service role only — orders" ON orders
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- admin_login_attempts: only the service role may read or write
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role only — admin_login_attempts" ON admin_login_attempts;
CREATE POLICY "service role only — admin_login_attempts" ON admin_login_attempts
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
