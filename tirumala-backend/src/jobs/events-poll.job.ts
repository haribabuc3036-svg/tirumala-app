import cron from 'node-cron';
import { scrapeEvents } from '../scraper/events.scraper';
import { updateLiveEvents } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runEventsPoll(): Promise<void> {
  console.log('🎉  Events scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeEvents();

    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  Events scraper failed: ${lastError}`);
      return;
    }

    await updateLiveEvents(result.data);

    lastRunAt = new Date().toISOString();
    lastError = null;

    console.log(
      `✅  Events scraper: ${result.data.length} events pushed to Firebase ` +
      `[live_updates/events]`,
    );
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Events scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the events polling scheduler.
 * Fires every 6 hours at 03:00, 09:00, 15:00, 21:00 IST (staggered from
 * the latest-updates poller which runs at 00:00 / 06:00 / 12:00 / 18:00).
 * Also runs once on startup so Firebase has fresh data immediately.
 */
export function startEventsPoller(): void {
  console.log('\n🎉  Events Poller starting — runs every 6 hours (03:00 / 09:00 / 15:00 / 21:00 IST)');

  // Staggered 20s after server start
  setTimeout(() => runEventsPoll(), 20_000);

  // 03:00, 09:00, 15:00, 21:00 IST
  cron.schedule('0 3,9,15,21 * * *', () => runEventsPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getEventsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
