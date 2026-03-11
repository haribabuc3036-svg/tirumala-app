-- ─── Migration 007: add booking_date + instructions to services_catalog ───────
--
-- booking_date  – ISO-8601 timestamp with timezone for when booking opens.
-- instructions  – Ordered array of instruction strings shown on the detail page.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS booking_date TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE IF EXISTS public.services_catalog
  ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT NULL;

-- ─── Test data ────────────────────────────────────────────────────────────────

UPDATE public.services_catalog SET
  booking_date  = '2026-03-15T09:00:00+05:30',
  instructions  = ARRAY[
    'Carry a valid government-issued photo ID (Aadhaar / Passport / Voter ID).',
    'Traditional dress code is strictly enforced – men must wear dhoti or pajama, women must wear saree or salwar kameez.',
    'Arrive at least 30 minutes before your allotted slot time.',
    'Mobile phones and electronic devices are not permitted inside the sanctum sanctorum.',
    'Children below 10 years are not allowed for special darshan tickets.'
  ]
WHERE id = 'sed';

UPDATE public.services_catalog SET
  booking_date  = '2026-04-02T06:00:00+05:30',
  instructions  = ARRAY[
    'Booking opens 30 days in advance on the TTD portal – have your login credentials ready.',
    'Only one seva per devotee per day is permitted.',
    'Report to the seva counter at least 1 hour before the scheduled time.',
    'Saree / dhoti dress code is mandatory; no night-dress or shorts allowed.'
  ]
WHERE id = 'arjitha-sevas';

UPDATE public.services_catalog SET
  booking_date  = '2026-03-28T05:30:00+05:30',
  instructions  = ARRAY[
    'Angapradakshinam is performed bare-bodied; devotees must wear only a dhoti.',
    'Advance online registration is mandatory – walk-ins are not permitted.',
    'Carry your confirmation slip and a valid photo ID on the day of the seva.',
    'Participants must complete a ritual bath before reporting to the designated counter.'
  ]
WHERE id = 'angapradakshinam';
