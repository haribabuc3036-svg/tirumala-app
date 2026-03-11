-- ─── Migration 008: replace single booking_date with booking_dates array ─────
--
-- booking_dates  – Array of ISO-8601 timestamps (with TZ) covering the full
--                  year (or any period).  Each entry is one monthly slot.
--                  The app picks the "active" entry (upcoming, or within the
--                  24-hour open window) automatically.
--
-- The old booking_date column is kept intact so that any client still
-- reading it does not break; new code only writes / reads booking_dates.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS booking_dates TIMESTAMPTZ[] DEFAULT NULL;

-- ─── Backfill: wrap existing single booking_date into a one-element array ────
UPDATE public.services_catalog
   SET booking_dates = ARRAY[booking_date]
 WHERE booking_date IS NOT NULL
   AND booking_dates IS NULL;

-- ─── Index for fast "find services with upcoming booking_dates" queries ───────
-- (optional but useful if the catalog grows large)
-- CREATE INDEX IF NOT EXISTS idx_services_catalog_booking_dates
--   ON public.services_catalog USING GIN (booking_dates);
