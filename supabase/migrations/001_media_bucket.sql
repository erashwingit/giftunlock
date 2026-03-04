-- =============================================================================
-- 001_media_bucket.sql
-- GiftUnlock – order-media bucket + RLS policies + storage quota table
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create the order-media storage bucket
--    • private (public = false) — files only accessible via signed URLs
--    • 50 MB per-file hard limit enforced at the Supabase layer
--    • Allowed MIME types as a second layer of defence
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-media',
  'order-media',
  false,
  52428800,            -- 50 MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS policies
--    Supabase's service_role key BYPASSES RLS automatically, so the upload
--    API (which uses createAdminClient / service_role) needs no explicit
--    allow policy. We only need to DENY anon and authenticated roles.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on storage.objects (Supabase enables this by default, but be explicit)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop old policies to allow idempotent re-runs
DROP POLICY IF EXISTS "gu_no_anon_insert"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_anon_select"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_anon_update"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_anon_delete"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_auth_select"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "gu_no_auth_delete"  ON storage.objects;

-- Block anonymous access to order-media
CREATE POLICY "gu_no_anon_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id != 'order-media');

CREATE POLICY "gu_no_anon_select" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id != 'order-media');

CREATE POLICY "gu_no_anon_update" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id != 'order-media');

CREATE POLICY "gu_no_anon_delete" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id != 'order-media');

-- Block authenticated (non-service) access to order-media
CREATE POLICY "gu_no_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id != 'order-media');

CREATE POLICY "gu_no_auth_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id != 'order-media');

CREATE POLICY "gu_no_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id != 'order-media');

CREATE POLICY "gu_no_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id != 'order-media');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Storage quota tracking table
--    Single-row pattern: id is always 1.
--    used_bytes is incremented by the upload API after each successful upload.
--    admin_warned is flipped to true once usage exceeds 900 MB so we don't
--    spam the logs with repeated warnings.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.storage_quota (
  id           integer     PRIMARY KEY DEFAULT 1,
  used_bytes   bigint      NOT NULL DEFAULT 0,
  admin_warned boolean     NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed with an initial row if it doesn't exist yet
INSERT INTO public.storage_quota (id, used_bytes, admin_warned)
VALUES (1, 0, false)
ON CONFLICT DO NOTHING;

-- Only the service_role (via API routes) may read / write quota.
-- All other roles are denied.
ALTER TABLE public.storage_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gu_quota_deny_all" ON public.storage_quota;
CREATE POLICY "gu_quota_deny_all" ON public.storage_quota
  USING (false)
  WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. (Optional) Helpful index for looking up all files under a slug prefix
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_storage_objects_order_media
  ON storage.objects (bucket_id, name)
  WHERE bucket_id = 'order-media';
