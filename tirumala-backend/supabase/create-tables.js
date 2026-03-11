require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
  CREATE TABLE IF NOT EXISTS public.darshan_updates (
    id           BIGSERIAL PRIMARY KEY,
    date         DATE        NOT NULL UNIQUE,
    pilgrims     TEXT        NOT NULL DEFAULT '',
    tonsures     TEXT        NOT NULL DEFAULT '',
    hundi        TEXT        NOT NULL DEFAULT '',
    waiting      TEXT        NOT NULL DEFAULT '',
    darshan_time TEXT        NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_darshan_updates_date
    ON public.darshan_updates (date DESC);

  CREATE TABLE IF NOT EXISTS public.ssd_status (
    id              BIGSERIAL PRIMARY KEY,
    running_slot    TEXT        NOT NULL DEFAULT '',
    balance_tickets TEXT        NOT NULL DEFAULT '',
    date            DATE        NOT NULL UNIQUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

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

  -- ─── Admin Users ──────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.admin_users (
    id            BIGSERIAL    PRIMARY KEY,
    username      TEXT         NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_users_updated_at'
    ) THEN
      CREATE TRIGGER trg_admin_users_updated_at
        BEFORE UPDATE ON public.admin_users
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END; $$;

  ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'admin_users' AND policyname = 'No public access'
    ) THEN
      CREATE POLICY "No public access" ON public.admin_users
        AS RESTRICTIVE FOR ALL TO public USING (false);
    END IF;
  END; $$;
`;

client.connect()
  .then(() => {
    console.log('Connected to Supabase PostgreSQL...');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅  Tables created successfully!');
    console.log('   - public.darshan_updates');
    console.log('   - public.ssd_status');
    console.log('   - public.services_catalog');
    console.log('   - public.service_images');
    console.log('   - public.wallpapers');
    console.log('   - public.place_regions');
    console.log('   - public.places');
    console.log('   - public.place_photos');
    console.log('   - public.admin_users');
    client.end();
  })
  .catch((err) => {
    console.error('❌  Error:', err.message);
    client.end();
    process.exit(1);
  });
