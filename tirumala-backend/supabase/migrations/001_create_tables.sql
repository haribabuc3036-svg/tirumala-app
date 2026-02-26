-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ─── darshan_updates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.darshan_updates (
  id           BIGSERIAL PRIMARY KEY,
  date         DATE        NOT NULL UNIQUE,   -- one row per day, upsert-safe
  pilgrims     TEXT        NOT NULL DEFAULT '',
  tonsures     TEXT        NOT NULL DEFAULT '',
  hundi        TEXT        NOT NULL DEFAULT '',
  waiting      TEXT        NOT NULL DEFAULT '',
  darshan_time TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast date lookups / ordering
CREATE INDEX IF NOT EXISTS idx_darshan_updates_date
  ON public.darshan_updates (date DESC);

-- ─── ssd_status ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ssd_status (
  id              BIGSERIAL PRIMARY KEY,
  running_slot    TEXT        NOT NULL DEFAULT '',
  balance_tickets TEXT        NOT NULL DEFAULT '',
  date            DATE        NOT NULL UNIQUE,   -- one row per day
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── services_catalog ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services_catalog (
  id               TEXT PRIMARY KEY,
  category_id      TEXT        NOT NULL,
  category_heading TEXT        NOT NULL,
  category_icon    TEXT        NOT NULL,
  category_image   TEXT,
  category_image_public_id TEXT,
  category_order   INTEGER     NOT NULL DEFAULT 0,
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  icon             TEXT        NOT NULL,
  icon_image       TEXT,
  icon_image_public_id TEXT,
  url              TEXT        NOT NULL,
  tag              TEXT,
  tag_color        TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_catalog_category_order
  ON public.services_catalog (category_order ASC, sort_order ASC);

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS category_image TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS category_image_public_id TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS icon_image TEXT;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS icon_image_public_id TEXT;

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

-- ─── wallpapers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallpapers (
  id         TEXT PRIMARY KEY,
  title      TEXT        NOT NULL,
  image_url  TEXT        NOT NULL,
  public_id  TEXT        NOT NULL UNIQUE,
  width      INTEGER,
  height     INTEGER,
  format     TEXT,
  bytes      INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallpapers_created_at
  ON public.wallpapers (created_at DESC);

-- ─── places (regions + places + photos) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.place_regions (
  id         TEXT PRIMARY KEY,
  title      TEXT        NOT NULL,
  subtitle   TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.places (
  id                        TEXT PRIMARY KEY,
  region_id                 TEXT        NOT NULL REFERENCES public.place_regions(id) ON DELETE CASCADE,
  name                      TEXT        NOT NULL,
  distance_from_tirumala_km NUMERIC(6,2) NOT NULL DEFAULT 0,
  description               TEXT        NOT NULL,
  maps_url                  TEXT        NOT NULL,
  sort_order                INTEGER     NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.place_photos (
  id         BIGSERIAL PRIMARY KEY,
  place_id   TEXT        NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  image_url  TEXT        NOT NULL,
  public_id  TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.place_photos
  ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE INDEX IF NOT EXISTS idx_place_regions_sort_order
  ON public.place_regions (sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_places_region_sort_order
  ON public.places (region_id ASC, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_place_photos_place_sort_order
  ON public.place_photos (place_id ASC, sort_order ASC);

-- ─── Enable RLS (Row Level Security) — service role key bypasses this ─────────
ALTER TABLE public.darshan_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssd_status      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

-- Allow the service role (backend) to do anything
CREATE POLICY "service role full access" ON public.darshan_updates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access" ON public.ssd_status
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access services" ON public.services_catalog
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon read services" ON public.services_catalog
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "service role full access service images" ON public.service_images
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon read service images" ON public.service_images
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "service role full access wallpapers" ON public.wallpapers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon read wallpapers" ON public.wallpapers
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "service role full access place regions" ON public.place_regions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access places" ON public.places
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access place photos" ON public.place_photos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon read place regions" ON public.place_regions
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "anon read places" ON public.places
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "anon read place photos" ON public.place_photos
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
