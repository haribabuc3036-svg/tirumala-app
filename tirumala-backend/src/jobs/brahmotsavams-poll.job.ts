import cron from 'node-cron';
import { scrapeBrahmotsavams } from '../scraper/brahmotsavams.scraper';
import { updateLiveBrahmotsavams } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runBrahmotsavamsPoll(): Promise<void> {
  console.log('🕌  Brahmotsavams scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeBrahmotsavams();

    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  Brahmotsavams scraper failed: ${lastError}`);
      return;
    }

    await updateLiveBrahmotsavams(result.data);

    lastRunAt = new Date().toISOString();
    lastError = null;

    console.log(
      `✅  Brahmotsavams scraper: ${result.data.length} entries pushed to Firebase ` +
      `[live_updates/brahmotsavams]`,
    );
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Brahmotsavams scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the brahmotsavams polling scheduler.
 * Fires every 6 hours at 01:00, 07:00, 13:00, 19:00 IST (staggered from
 * other pollers to spread load).
 * Also runs once on startup so Firebase has fresh data immediately.
 */
export function startBrahmotsavamsPoller(): void {
  console.log('\n🕌  Brahmotsavams Poller starting — runs every 6 hours (01:00 / 07:00 / 13:00 / 19:00 IST)');

  // Staggered 25s after server start
  setTimeout(() => runBrahmotsavamsPoll(), 25_000);

  // 01:00, 07:00, 13:00, 19:00 IST
  cron.schedule('0 1,7,13,19 * * *', () => runBrahmotsavamsPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getBrahmotsavamsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
