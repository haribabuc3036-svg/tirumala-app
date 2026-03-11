-- Fresh, idempotent schema fix for service media support
-- Run in Supabase SQL Editor (safe to re-run)

-- 1) Ensure required columns exist on services_catalog
ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS category_image TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS category_image_public_id TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS image TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS image_public_id TEXT;

-- 2) Ensure service_images gallery table exists
CREATE TABLE IF NOT EXISTS public.service_images (
  id         BIGSERIAL PRIMARY KEY,
  service_id TEXT        NOT NULL REFERENCES public.services_catalog(id) ON DELETE CASCADE,
  image_url  TEXT        NOT NULL,
  public_id  TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_images_service_sort_order
  ON public.service_images (service_id ASC, sort_order ASC);

-- 3) RLS for service_images
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'service_images'
      AND policyname = 'service role full access service images'
  ) THEN
    CREATE POLICY "service role full access service images"
      ON public.service_images
      FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'service_images'
      AND policyname = 'anon read service images'
  ) THEN
    CREATE POLICY "anon read service images"
      ON public.service_images
      FOR SELECT
      USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
  END IF;
END $$;
