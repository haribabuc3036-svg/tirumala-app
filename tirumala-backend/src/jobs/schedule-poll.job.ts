import cron from 'node-cron';
import { scrapeDaySchedule } from '../scraper/schedule.scraper';
import { updateLiveDaySchedule } from '../services/firebase.service';

// ─── State ─────────────────────────────────────────────────────────────────────

let lastRunAt: string | null = null;
let lastError: string | null = null;

// ─── Core logic ────────────────────────────────────────────────────────────────

export async function runSchedulePoll(): Promise<void> {
  console.log('📅  Day-Schedule scraper: starting…');
  try {
    const result = await scrapeDaySchedule();

    if (!result.success || !result.data) {
      lastError = result.error ?? 'unknown error';
      console.error(`❌  Day-Schedule scraper failed: ${lastError}`);
      return;
    }

    await updateLiveDaySchedule(result.data);

    lastRunAt = new Date().toISOString();
    lastError = null;

    console.log(
      `✅  Day-Schedule scraper: pushed to Firebase — ${result.data.date} (${result.data.day}), ` +
      `${result.data.schedules.length} entries`
    );
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error('❌  Day-Schedule scraper threw:', lastError);
  }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Start the daily Day-Schedule cron.
 * Fires once at 00:01 IST every day.
 * Also runs immediately on startup so Firebase always has today's data.
 */
export function startSchedulePoller(): void {
  console.log('\n📅  Day-Schedule Poller starting — runs daily at 00:01 IST');

  // Staggered 10s after server start (axios is lightweight — no large delays needed)
  setTimeout(() => runSchedulePoll(), 10_000);

  // Then every day at 00:01 IST
  cron.schedule('1 0 * * *', () => runSchedulePoll(), {
    timezone: 'Asia/Kolkata',
  });
}

// ─── Status export (for /health) ───────────────────────────────────────────────

export function getSchedulePollerStatus() {
  return { lastRunAt, lastError };
}
