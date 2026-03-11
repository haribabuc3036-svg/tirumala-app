-- ─────────────────────────────────────────────────────────────────────────────
-- 006_add_ssd_locations.sql
-- Physical SSD token counter locations shown in the mobile app.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ssd_locations (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT        NOT NULL,
  area             TEXT        NOT NULL,
  timings          TEXT        NOT NULL,
  note             TEXT        NULL,
  image_url        TEXT        NULL,
  image_public_id  TEXT        NULL,
  maps_url         TEXT        NOT NULL,
  tag              TEXT        NULL,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE ssd_locations ENABLE ROW LEVEL SECURITY;

-- Public read (anon key in mobile app)
CREATE POLICY "Public can read active ssd_locations"
  ON ssd_locations FOR SELECT
  USING (is_active = TRUE);

-- Service role can do everything (backend)
CREATE POLICY "Service role full access ssd_locations"
  ON ssd_locations FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ─── Seed data ────────────────────────────────────────────────────────────────

INSERT INTO ssd_locations (name, area, timings, note, maps_url, tag, sort_order) VALUES
  ('Vishnu Nivasam Counter',          'Tirumala, Near Bus Stand',         '06:00 AM – 06:00 PM', 'Main distribution point. Highest daily token quota.',         'https://maps.google.com/?q=Vishnu+Nivasam+Tirumala',                    'High Quota',      1),
  ('Padmavathi Guest House Counter',  'Tirumala, West Mada Street',       '06:00 AM – 06:00 PM', NULL,                                                          'https://maps.google.com/?q=Padmavathi+Guest+House+Tirumala',             NULL,              2),
  ('Srinivasam Complex Counter',      'Tirumala, Near Alipiri Check-post','06:00 AM – 05:00 PM', NULL,                                                          'https://maps.google.com/?q=Srinivasam+Complex+Tirumala',                 NULL,              3),
  ('Kalyanakattu Counter',            'Tirumala, Near Mahadwaram',        '05:30 AM – 06:00 PM', 'Opens early. Limited tokens – arrive before 5:30 AM.',        'https://maps.google.com/?q=Kalyanakattu+Tirumala',                       'Opens Early',     4),
  ('Central Reception Office (CRO)',  'Tirupati, Near Railway Station',   '07:00 AM – 07:00 PM', 'Pre-booking for pilgrims arriving by train.',                 'https://maps.google.com/?q=TTD+Central+Reception+Office+Tirupati',       'Train Pilgrims',  5),
  ('Alipiri Foot-path Facilitation',  'Alipiri, Tirupati',                '05:00 AM – 04:00 PM', 'Issued exclusively to pilgrims climbing on foot.',            'https://maps.google.com/?q=Alipiri+Footpath+Tirupati',                   'Foot Climb Only', 6);
