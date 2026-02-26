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

-- ─── Enable RLS (Row Level Security) — service role key bypasses this ─────────
ALTER TABLE public.darshan_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssd_status      ENABLE ROW LEVEL SECURITY;

-- Allow the service role (backend) to do anything
CREATE POLICY "service role full access" ON public.darshan_updates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service role full access" ON public.ssd_status
  FOR ALL USING (auth.role() = 'service_role');
