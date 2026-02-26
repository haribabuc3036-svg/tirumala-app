import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  console.log('Running migration...\n');

  const statements = [
    `CREATE TABLE IF NOT EXISTS public.darshan_updates (
      id           BIGSERIAL PRIMARY KEY,
      date         DATE        NOT NULL UNIQUE,
      pilgrims     TEXT        NOT NULL DEFAULT '',
      tonsures     TEXT        NOT NULL DEFAULT '',
      hundi        TEXT        NOT NULL DEFAULT '',
      waiting      TEXT        NOT NULL DEFAULT '',
      darshan_time TEXT        NOT NULL DEFAULT '',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_darshan_updates_date ON public.darshan_updates (date DESC)`,
    `CREATE TABLE IF NOT EXISTS public.ssd_status (
      id              BIGSERIAL PRIMARY KEY,
      running_slot    TEXT        NOT NULL DEFAULT '',
      balance_tickets TEXT        NOT NULL DEFAULT '',
      date            DATE        NOT NULL UNIQUE,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).select();
    if (error) {
      // rpc may not exist — fall back to direct REST
      console.warn(`RPC not available (${error.message}), trying pg directly...`);
      break;
    }
  }

  // Verify tables exist by trying a simple select
  const { error: e1 } = await supabase.from('darshan_updates').select('id').limit(1);
  const { error: e2 } = await supabase.from('ssd_status').select('id').limit(1);

  if (!e1 && !e2) {
    console.log('✅  Both tables already exist and are accessible!');
  } else {
    if (e1) console.error('❌  darshan_updates:', e1.message);
    if (e2) console.error('❌  ssd_status:', e2.message);
    console.log('\n👉  Please run the SQL manually in Supabase Dashboard → SQL Editor:');
    console.log('    File: supabase/migrations/001_create_tables.sql');
  }
}

migrate();
