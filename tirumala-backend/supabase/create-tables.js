require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
  CREATE TABLE IF NOT EXISTS public.darshan_updates (
    id           BIGSERIAL PRIMARY KEY,
    date         DATE        NOT NULL UNIQUE,
    pilgrims     TEXT        NOT NULL DEFAULT '',
    tonsures     TEXT        NOT NULL DEFAULT '',
    hundi        TEXT        NOT NULL DEFAULT '',
    waiting      TEXT        NOT NULL DEFAULT '',
    darshan_time TEXT        NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_darshan_updates_date
    ON public.darshan_updates (date DESC);

  CREATE TABLE IF NOT EXISTS public.ssd_status (
    id              BIGSERIAL PRIMARY KEY,
    running_slot    TEXT        NOT NULL DEFAULT '',
    balance_tickets TEXT        NOT NULL DEFAULT '',
    date            DATE        NOT NULL UNIQUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

client.connect()
  .then(() => {
    console.log('Connected to Supabase PostgreSQL...');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅  Tables created successfully!');
    console.log('   - public.darshan_updates');
    console.log('   - public.ssd_status');
    client.end();
  })
  .catch((err) => {
    console.error('❌  Error:', err.message);
    client.end();
    process.exit(1);
  });
