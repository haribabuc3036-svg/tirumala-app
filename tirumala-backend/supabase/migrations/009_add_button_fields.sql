-- Migration 009: Add configurable button text and URL to services_catalog
-- These control the CTA button label and destination on the service detail page.
-- If null, the app falls back to "Check Availability" and the existing `url` column.

ALTER TABLE services_catalog
  ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS button_url  TEXT DEFAULT NULL;
