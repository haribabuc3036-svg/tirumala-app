import cron from 'node-cron';
import { scrapeDarshanNews } from '../scraper/darshan-news.scraper';
import { updateLiveDarshanNews } from '../services/firebase.service';

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

export async function runDarshanNewsPoll(): Promise<void> {
  console.log('🙏  Darshan-News scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeDarshanNews();
    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  Darshan-News scraper failed: ${lastError}`);
      return;
    }
    await updateLiveDarshanNews(result.data);
    lastRunAt = new Date().toISOString();
    lastError = null;
    console.log(`✅  Darshan-News scraper: ${result.data.length} entries pushed to Firebase [live_updates/darshan_news]`);
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Darshan-News scraper threw:', lastError);
  }
}

/**
 * Fires every 4 hours at 00:30, 04:30, 08:30, 12:30, 16:30, 20:30 IST.
 * Darshan counts update more frequently so polled more often.
 * Also runs 45s after startup.
 */
export function startDarshanNewsPoller(): void {
  console.log('\n🙏  Darshan-News Poller starting — runs every 4 hours (IST :30 past)');
  setTimeout(() => runDarshanNewsPoll(), 45_000);
  cron.schedule('30 0,4,8,12,16,20 * * *', () => runDarshanNewsPoll(), { timezone: 'Asia/Kolkata' });
}

export function getDarshanNewsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
