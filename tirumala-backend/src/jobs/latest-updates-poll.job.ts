import cron from 'node-cron';
import { scrapeLatestUpdates } from '../scraper/latest-updates.scraper';
import { updateLiveLatestUpdates } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runLatestUpdatesPoll(): Promise<void> {
  console.log('📋  Latest-Updates scraper: starting…');
  totalRuns++;

  const result = await scrapeLatestUpdates();

  if (!result.success || result.data.length === 0) {
    lastError = result.error ?? 'no entries parsed';
    console.error(`❌  Latest-Updates scraper failed: ${lastError}`);
    return;
  }

  await updateLiveLatestUpdates(result.data);

  lastRunAt = new Date().toISOString();
  lastError = null;

  console.log(
    `✅  Latest-Updates scraper: ${result.data.length} entries pushed to Firebase ` +
    `[live_updates/latest_updates]`
  );
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the latest-updates polling scheduler.
 * Fires every 6 hours at 00:00, 06:00, 12:00, 18:00 IST.
 * Also runs immediately on startup so Firebase always has fresh data.
 */
export function startLatestUpdatesPoller(): void {
  console.log('\n📋  Latest-Updates Poller starting — runs every 6 hours (00:00 / 06:00 / 12:00 / 18:00 IST)');

  // Run immediately on startup (4 second delay — staggers with other pollers)
  setTimeout(() => runLatestUpdatesPoll(), 4_000);

  // 00:00, 06:00, 12:00, 18:00 IST
  cron.schedule('0 0,6,12,18 * * *', () => runLatestUpdatesPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getLatestUpdatesPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
