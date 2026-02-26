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
    category_order   INTEGER     NOT NULL DEFAULT 0,
    title            TEXT        NOT NULL,
    description      TEXT        NOT NULL,
    icon             TEXT        NOT NULL,
    url              TEXT        NOT NULL,
    tag              TEXT,
    tag_color        TEXT,
    sort_order       INTEGER     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_services_catalog_category_order
    ON public.services_catalog (category_order ASC, sort_order ASC);

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
    console.log('   - public.wallpapers');
    console.log('   - public.place_regions');
    console.log('   - public.places');
    console.log('   - public.place_photos');
    client.end();
  })
  .catch((err) => {
    console.error('❌  Error:', err.message);
    client.end();
    process.exit(1);
  });
