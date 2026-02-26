require('dotenv').config();
const { Client } = require('pg');

const sql = `
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read services" ON public.services_catalog;
CREATE POLICY "anon read services"
  ON public.services_catalog
  FOR SELECT
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "anon read wallpapers" ON public.wallpapers;
CREATE POLICY "anon read wallpapers"
  ON public.wallpapers
  FOR SELECT
  USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.services_catalog TO anon, authenticated;
GRANT SELECT ON TABLE public.wallpapers TO anon, authenticated;
`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client
  .connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log('✅ Applied RLS + SELECT grants for public.services_catalog and public.wallpapers');
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Failed:', err.message);
    client.end();
    process.exit(1);
  });
