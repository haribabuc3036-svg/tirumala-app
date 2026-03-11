import cron from 'node-cron';
import { scrapeTempleNews } from '../scraper/temple-news.scraper';
import { updateLiveTempleNews } from '../services/firebase.service';

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

export async function runTempleNewsPoll(): Promise<void> {
  console.log('🛕  Temple-News scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeTempleNews();
    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  Temple-News scraper failed: ${lastError}`);
      return;
    }
    await updateLiveTempleNews(result.data);
    lastRunAt = new Date().toISOString();
    lastError = null;
    console.log(`✅  Temple-News scraper: ${result.data.length} entries pushed to Firebase [live_updates/temple_news]`);
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Temple-News scraper threw:', lastError);
  }
}

/**
 * Fires every 6 hours at 04:00, 10:00, 16:00, 22:00 IST.
 * Also runs 35s after startup.
 */
export function startTempleNewsPoller(): void {
  console.log('\n🛕  Temple-News Poller starting — runs every 6 hours (04:00 / 10:00 / 16:00 / 22:00 IST)');
  setTimeout(() => runTempleNewsPoll(), 35_000);
  cron.schedule('0 4,10,16,22 * * *', () => runTempleNewsPoll(), { timezone: 'Asia/Kolkata' });
}

export function getTempleNewsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
