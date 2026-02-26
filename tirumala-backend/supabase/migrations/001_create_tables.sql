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

-- ─── Enable RLS (Row Level Security) — service role key bypasses this ─────────
ALTER TABLE public.darshan_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssd_status      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

-- Allow the service role (backend) to do anything
CREATE POLICY "service role full access" ON public.darshan_updates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access" ON public.ssd_status
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access services" ON public.services_catalog
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "anon read services" ON public.services_catalog
  FOR SELECT USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
