import cron from 'node-cron';
import { scrapePilgrimsFromTirumala } from '../scraper/pilgrims.scraper';
import {
  getLivePilgrimsRecent,
  updateLivePilgrimsRecent,
} from '../services/firebase.service';
import { upsertDarshanUpdate } from '../services/supabase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runPilgrimsPoll(): Promise<void> {
  console.log('🛕  Pilgrims scraper: starting…');
  totalRuns++;
  try {

  const result = await scrapePilgrimsFromTirumala();

  if (!result.success || result.data.length === 0) {
    lastError = result.error ?? 'no entries parsed';
    console.error(`❌  Pilgrims scraper failed: ${lastError}`);
    return;
  }

  const scraped = result.data; // newest-first, up to 10

  // ── Firebase: merge with existing, keep newest 10 unique dates ───────────────
  const existing = await getLivePilgrimsRecent();

  // Build a map of date → entry; scraped entries win (they are fresher)
  const merged = new Map<string, (typeof scraped)[0]>();
  for (const e of existing) merged.set(e.date, e);
  for (const e of scraped)  merged.set(e.date, e);

  // Sort by date descending, take top 10
  const top10 = [...merged.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  await updateLivePilgrimsRecent(top10);

  // ── Supabase: upsert each scraped entry (one row per date) ───────────────────
  let supabaseErrors = 0;
  for (const entry of scraped) {
    try {
      await upsertDarshanUpdate({
        date:         entry.date,
        pilgrims:     entry.pilgrims,
        tonsures:     entry.tonsures,
        hundi:        entry.hundi,
        waiting:      entry.waiting,
        darshan_time: entry.darshan_time,
      });
    } catch (err: unknown) {
      supabaseErrors++;
      console.warn(`⚠️  Pilgrims scraper: Supabase upsert failed for ${entry.date}: ${(err as Error).message}`);
    }
  }

  lastRunAt = new Date().toISOString();
  lastError = null;

  console.log(
    `✅  Pilgrims scraper: ${scraped.length} entries pushed to Firebase` +
    (supabaseErrors > 0 ? ` (${supabaseErrors} Supabase errors)` : ' + Supabase')
  );
  scraped.forEach((e) => console.log(`   ${e.date}  pilgrims=${e.pilgrims}  tonsures=${e.tonsures}  hundi=${e.hundi}  waiting=${e.waiting}  time=${e.darshan_time}`));
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Pilgrims scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the pilgrims polling scheduler.
 * Runs every 8 hours at 00:00, 08:00, 16:00 IST.
 * Also fires immediately on startup so Firebase always has fresh data.
 */
export function startPilgrimsPoller(): void {
  console.log('\n🛕  Pilgrims Poller starting — runs every 8 hours (00:00 / 08:00 / 16:00 IST)');

  // Run immediately on startup (135 second delay — after other pollers)
  setTimeout(() => runPilgrimsPoll(), 135_000);

  // 00:00, 08:00, 16:00 IST
  cron.schedule('0 0,8,16 * * *', () => runPilgrimsPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getPilgrimsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
