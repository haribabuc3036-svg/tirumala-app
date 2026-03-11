import cron from 'node-cron';
import { scrapeUtsavams } from '../scraper/utsavams.scraper';
import { updateLiveUtsavams } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runUtsavamsPoll(): Promise<void> {
  console.log('🎊  Utsavams scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeUtsavams();

    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  Utsavams scraper failed: ${lastError}`);
      return;
    }

    await updateLiveUtsavams(result.data);

    lastRunAt = new Date().toISOString();
    lastError = null;

    console.log(
      `✅  Utsavams scraper: ${result.data.length} entries pushed to Firebase ` +
      `[live_updates/utsavams]`,
    );
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Utsavams scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the utsavams polling scheduler.
 * Fires every 6 hours at 02:00, 08:00, 14:00, 20:00 IST (staggered from
 * other pollers to spread load).
 * Also runs once on startup so Firebase has fresh data immediately.
 */
export function startUtsavamsPoller(): void {
  console.log('\n🎊  Utsavams Poller starting — runs every 6 hours (02:00 / 08:00 / 14:00 / 20:00 IST)');

  // Staggered 30s after server start
  setTimeout(() => runUtsavamsPoll(), 30_000);

  // 02:00, 08:00, 14:00, 20:00 IST
  cron.schedule('0 2,8,14,20 * * *', () => runUtsavamsPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getUtsavamsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
