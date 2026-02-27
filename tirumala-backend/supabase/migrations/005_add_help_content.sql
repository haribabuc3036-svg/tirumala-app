-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ─── help_faqs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.help_faqs (
  id         BIGSERIAL   PRIMARY KEY,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_faqs_sort_order
  ON public.help_faqs (sort_order ASC);

-- ─── help_dress_code ──────────────────────────────────────────────────────────
-- section: 'men' | 'women' | 'general'
CREATE TABLE IF NOT EXISTS public.help_dress_code (
  id         BIGSERIAL   PRIMARY KEY,
  section    TEXT        NOT NULL CHECK (section IN ('men', 'women', 'general')),
  content    TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_dress_code_section_sort
  ON public.help_dress_code (section ASC, sort_order ASC);

-- ─── help_dos_donts ───────────────────────────────────────────────────────────
-- type: 'do' | 'dont'
CREATE TABLE IF NOT EXISTS public.help_dos_donts (
  id         BIGSERIAL   PRIMARY KEY,
  type       TEXT        NOT NULL CHECK (type IN ('do', 'dont')),
  content    TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_dos_donts_type_sort
  ON public.help_dos_donts (type ASC, sort_order ASC);

-- ─── help_contact_support ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.help_contact_support (
  id         BIGSERIAL   PRIMARY KEY,
  label      TEXT        NOT NULL,
  sub_label  TEXT        NOT NULL DEFAULT '',
  icon       TEXT        NOT NULL DEFAULT 'web',
  url        TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_contact_support_sort_order
  ON public.help_contact_support (sort_order ASC);

-- ─── Enable Row Level Security (read-only for anon) ───────────────────────────
ALTER TABLE public.help_faqs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_dress_code     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_dos_donts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_contact_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on help_faqs"
  ON public.help_faqs FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on help_dress_code"
  ON public.help_dress_code FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on help_dos_donts"
  ON public.help_dos_donts FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on help_contact_support"
  ON public.help_contact_support FOR SELECT USING (is_active = true);

-- ─── Seed default data ────────────────────────────────────────────────────────

-- FAQs
INSERT INTO public.help_faqs (question, answer, sort_order) VALUES
  ('How do I get a free darshan ticket (SSD)?',
   'Sudarshana Seva Darshanam (SSD) tokens are issued daily at designated counters in Tirumala and Tirupati. Tokens are limited — arrive early. Check live availability via the SSD Token screen in this app.',
   1),
  ('What is the dress code at Tirumala temple?',
   'Men must wear dhoti (veshti) or pyjama with shirt/kurta. Women must wear saree, half-saree, salwar kameez or churidar with dupatta. Western wear such as jeans, shorts and T-shirts is not allowed inside the temple.',
   2),
  ('How early should I arrive for darshan?',
   'For SSD (free) darshan, arrive at least 3–5 hours before token distribution begins. For paid quota darshans, booking opens 30 days in advance on the TTD online portal.',
   3),
  ('How do I book a seva online?',
   'Visit the official TTD website (tirupatibalaji.ap.gov.in) or the TTD Mobile App. Under "Online Services" select the seva, choose a date, and provide pilgrim details.',
   4),
  ('What items are not allowed inside the temple?',
   'Mobile phones, cameras, leather goods, footwear, eatables, and electronic devices are not permitted inside the inner precincts. Cloak rooms are available to deposit belongings.',
   5),
  ('Where can I find today''s schedule and timings?',
   'Go to the Darshan News tab in this app and switch to the Schedule section to view today''s seva and darshan timings as officially published by TTD.',
   6)
ON CONFLICT DO NOTHING;

-- Dress Code — Men
INSERT INTO public.help_dress_code (section, content, sort_order) VALUES
  ('men', 'Dhoti (veshti) with upper cloth or shirt', 1),
  ('men', 'Pyjama with kurta or shirt', 2),
  ('men', 'Lungi with shirt (only for aged/infirm)', 3),
  ('men', 'No jeans, trousers, shorts or T-shirts', 4),
  ('men', 'No sleeveless shirts or vests', 5)
ON CONFLICT DO NOTHING;

-- Dress Code — Women
INSERT INTO public.help_dress_code (section, content, sort_order) VALUES
  ('women', 'Saree or half-saree with blouse', 1),
  ('women', 'Salwar kameez or churidar with dupatta', 2),
  ('women', 'Skirts below knee with blouse are accepted', 3),
  ('women', 'No jeans, shorts, leggings worn alone, or Western dresses', 4),
  ('women', 'No sleeveless tops', 5)
ON CONFLICT DO NOTHING;

-- Dress Code — General
INSERT INTO public.help_dress_code (section, content, sort_order) VALUES
  ('general', 'Children under 10 are exempt from strict dress code', 1),
  ('general', 'Footwear must be removed before entering the temple premises', 2),
  ('general', 'Dress code is strictly enforced at all entry queues', 3)
ON CONFLICT DO NOTHING;

-- Do's
INSERT INTO public.help_dos_donts (type, content, sort_order) VALUES
  ('do', 'Arrive early — queues start forming well before gate opening', 1),
  ('do', 'Carry valid government-issued photo ID for all family members', 2),
  ('do', 'Dress modestly following the temple dress code', 3),
  ('do', 'Maintain silence and reverence inside the inner sanctum', 4),
  ('do', 'Deposit valuables and phones in the complimentary cloak rooms', 5),
  ('do', 'Follow queue discipline and TTD volunteer instructions', 6),
  ('do', 'Carry enough water and light snacks for long wait times', 7)
ON CONFLICT DO NOTHING;

-- Don'ts
INSERT INTO public.help_dos_donts (type, content, sort_order) VALUES
  ('dont', 'Do not bring mobile phones, cameras, or electronic devices', 1),
  ('dont', 'Do not wear leather goods (belts, wallets, bags) inside', 2),
  ('dont', 'Do not bring flowers, coconuts, or outside prasadam', 3),
  ('dont', 'Do not smoke, consume alcohol, or chew tobacco', 4),
  ('dont', 'Do not make noise, rush, or push in the queue lines', 5),
  ('dont', 'Do not touch the deity idol or sacred items', 6),
  ('dont', 'Do not visit if you are in a state of grieving (death in family within 10 days)', 7)
ON CONFLICT DO NOTHING;

-- Contact & Support
INSERT INTO public.help_contact_support (label, sub_label, icon, url, sort_order) VALUES
  ('TTD Official Website',   'tirupatibalaji.ap.gov.in',     'web',            'https://www.tirupatibalaji.ap.gov.in', 1),
  ('TTD Helpline',           '1800-425-1333 (Toll Free)',     'phone-outline',  'tel:18004251333',                      2),
  ('Online Ticket Booking',  'Book darshan & sevas',          'ticket-account', 'https://ttdsevaonline.com',             3),
  ('Email TTD',              'ttdonline@tirumala.org',        'email-outline',  'mailto:ttdonline@tirumala.org',         4)
ON CONFLICT DO NOTHING;
