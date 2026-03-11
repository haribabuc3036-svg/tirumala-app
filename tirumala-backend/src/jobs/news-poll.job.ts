import cron from 'node-cron';
import { scrapeLatestNews } from '../scraper/news.scraper';
import { updateLiveLatestNews } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runNewsPoll(): Promise<void> {
  console.log('📰  Latest-News scraper: starting…');
  totalRuns++;
  try {

  const result = await scrapeLatestNews();

  if (!result.success || result.data.length === 0) {
    lastError = result.error ?? 'no entries parsed';
    console.error(`❌  Latest-News scraper failed: ${lastError}`);
    return;
  }

  await updateLiveLatestNews(result.data);

  lastRunAt = new Date().toISOString();
  lastError = null;

  console.log(
    `✅  Latest-News scraper: ${result.data.length} articles pushed to Firebase ` +
    `[live_updates/latest_news]`
  );
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Latest-News scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the latest-news polling scheduler.
 * Fires every 4 hours at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 IST.
 * Also runs immediately on startup so Firebase always has fresh data.
 */
export function startNewsPoller(): void {
  console.log('\n📰  Latest-News Poller starting — runs every 4 hours IST');

  // Staggered startup (180s delay — last to run, after all other pollers)
  setTimeout(() => runNewsPoll(), 180_000);

  // Every 4 hours IST
  cron.schedule('0 */4 * * *', () => runNewsPoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getNewsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
