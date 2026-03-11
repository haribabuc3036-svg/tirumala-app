import cron from 'node-cron';
import { scrapeSsdFromTirumala } from '../scraper/ssd.scraper';
import {
  getLiveSsdStatus,
  updateLiveSsdStatus,
} from '../services/firebase.service';

// ─── Polling State ─────────────────────────────────────────────────────────────

let isRunning = false;  // guard against overlapping runs
let lastRunAt: string | null = null;
let lastError: string | null = null;
let totalRuns = 0;
let totalUpdates = 0;

// ─── Core Poll Logic ───────────────────────────────────────────────────────────

/**
 * One polling cycle:
 * 1. Scrape the TTD website
 * 2. Compare each scraped value against what is currently in Firebase
 * 3. Write to Firebase (and Supabase for persistence) ONLY when data changed
 */
export async function runPollCycle(): Promise<{
  updated: boolean;
  changes: string[];
  errors: string[];
}> {
  const changes: string[] = [];
  const errors: string[] = [];
  let updated = false;

  // ── SSD Token (scrapes Slotted Sarva Darshan from tirumala.org) ───────────────
  const scrapeResult = await scrapeSsdFromTirumala();

  if (!scrapeResult.success || !scrapeResult.data) {
    errors.push(`SSD scrape failed: ${scrapeResult.error}`);
    return { updated, changes, errors };
  }

  const scraped = scrapeResult.data;
  const current = await getLiveSsdStatus();

  const slotChanged    = current?.running_slot    !== scraped.running_slot;
  const balanceChanged = current?.balance_tickets !== scraped.balance_tickets;

  if (slotChanged || balanceChanged) {
    await updateLiveSsdStatus({
      running_slot:    scraped.running_slot,
      slot_date:       scraped.slot_date,
      balance_date:    scraped.balance_date,
      balance_tickets: scraped.balance_tickets,
    });

    if (slotChanged)    changes.push(`SSD slot: ${current?.running_slot ?? 'null'} → ${scraped.running_slot}`);
    if (balanceChanged) changes.push(`SSD balance: ${current?.balance_tickets ?? 'null'} → ${scraped.balance_tickets}`);
    updated = true;
  }

  return { updated, changes, errors };
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Start the TTD polling scheduler.
 *
 * @param schedule  node-cron expression (default: every 5 minutes "* /5 * * * *")
 */
export function startTtdPoller(schedule = '*/5 * * * *') {
  const validSchedule = cron.validate(schedule) ? schedule : '*/5 * * * *';

  console.log(`\n⏰  TTD Poller starting — schedule: "${validSchedule}" (${getScheduleDescription(validSchedule)})`);

  // Run immediately on startup so we don't wait 5 min for first data
  setTimeout(() => runOnce(), 5_000);

  // Then on the cron schedule
  cron.schedule(validSchedule, () => runOnce(), { timezone: 'Asia/Kolkata' });
}

async function runOnce() {
  if (isRunning) {
    console.log('⏭  TTD Poller: skipping run (previous still in progress)');
    return;
  }

  isRunning = true;
  totalRuns++;
  const startTime = Date.now();

  try {
    const { updated, changes, errors } = await runPollCycle();

    lastRunAt = new Date().toISOString();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (errors.length > 0) {
      lastError = errors.join('; ');
      console.warn(`⚠️  TTD Poller [run #${totalRuns}] finished with warnings (${elapsed}s):`);
      errors.forEach((e: string) => console.warn(`   • ${e}`));
    }

    if (updated) {
      totalUpdates++;
      console.log(`✅  TTD Poller [run #${totalRuns}] — UPDATED (${elapsed}s):`);
      changes.forEach((c) => console.log(`   ↳ ${c}`));
    } else {
      console.log(`🔍  TTD Poller [run #${totalRuns}] — no changes detected (${elapsed}s)`);
    }
  } catch (err: unknown) {
    lastError = (err as Error).message;
    console.error(`❌  TTD Poller [run #${totalRuns}] error:`, lastError);
  } finally {
    isRunning = false;
  }
}

// ─── Status Export (for /health endpoint) ─────────────────────────────────────

export function getPollerStatus() {
  return {
    isRunning,
    lastRunAt,
    lastError,
    totalRuns,
    totalUpdates,
  };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getScheduleDescription(expr: string): string {
  const map: Record<string, string> = {
    '*/5 * * * *': 'every 5 min',
    '*/10 * * * *': 'every 10 min',
    '*/15 * * * *': 'every 15 min',
    '*/30 * * * *': 'every 30 min',
    '* * * * *': 'every minute',
  };
  return map[expr] ?? expr;
}
