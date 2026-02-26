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
    client.end();
  })
  .catch((err) => {
    console.error('❌  Error:', err.message);
    client.end();
    process.exit(1);
  });
