-- Add overview visibility and ordering fields to services_catalog
-- show_on_overview: controls whether a service appears on the Home > Overview pinned section
-- overview_order:   controls the display order within that pinned section (lower = first)
-- Safe to run multiple times (idempotent).

ALTER TABLE public.services_catalog
  ADD COLUMN IF NOT EXISTS show_on_overview BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.services_catalog
  ADD COLUMN IF NOT EXISTS overview_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_services_catalog_overview
  ON public.services_catalog (show_on_overview, overview_order ASC)
  WHERE show_on_overview = TRUE;

-- Seed a default set of pinned services.
-- Change show_on_overview / overview_order any time in Supabase Table Editor
-- without a code deploy — the app will pick it up automatically.
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 1 WHERE id = 'sed';
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 2 WHERE id = 'ssd-token';
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 3 WHERE id = 'arjitha-sevas';
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 4 WHERE id = 'accommodation';
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 5 WHERE id = 'differently-abled';
UPDATE public.services_catalog SET show_on_overview = TRUE, overview_order = 6 WHERE id = 'online-sevas';
