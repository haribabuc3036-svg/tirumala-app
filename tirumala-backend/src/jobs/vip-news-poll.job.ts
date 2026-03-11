import cron from 'node-cron';
import { scrapeVipNews } from '../scraper/vip-news.scraper';
import { updateLiveVipNews } from '../services/firebase.service';

let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;

export async function runVipNewsPoll(): Promise<void> {
  console.log('⭐  VIP-News scraper: starting…');
  totalRuns++;
  try {
    const result = await scrapeVipNews();
    if (!result.success || result.data.length === 0) {
      lastError = result.error ?? 'no entries parsed';
      console.error(`❌  VIP-News scraper failed: ${lastError}`);
      return;
    }
    await updateLiveVipNews(result.data);
    lastRunAt = new Date().toISOString();
    lastError = null;
    console.log(`✅  VIP-News scraper: ${result.data.length} entries pushed to Firebase [live_updates/vip_news]`);
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  VIP-News scraper threw:', lastError);
  }
}

/**
 * Fires every 6 hours at 05:00, 11:00, 17:00, 23:00 IST.
 * Also runs 40s after startup.
 */
export function startVipNewsPoller(): void {
  console.log('\n⭐  VIP-News Poller starting — runs every 6 hours (05:00 / 11:00 / 17:00 / 23:00 IST)');
  setTimeout(() => runVipNewsPoll(), 40_000);
  cron.schedule('0 5,11,17,23 * * *', () => runVipNewsPoll(), { timezone: 'Asia/Kolkata' });
}

export function getVipNewsPollerStatus() {
  return { lastRunAt, lastError, totalRuns };
}
