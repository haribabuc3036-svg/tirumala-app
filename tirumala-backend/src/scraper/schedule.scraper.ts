import { chromium } from 'playwright';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * A single schedule entry — one time slot and its associated event/seva.
 */
export interface ScheduleEntry {
  time:  string;  // e.g. "02:30-03:00 hrs"
  event: string;  // e.g. "Suprabhatam"
}

/**
 * The full day-schedule block scraped from tirumala.org
 *
 * Source: https://www.tirumala.org/ → Day Schedules section
 *
 * Live block on page:
 *   Day Schedules
 *   26-02-2026 , Thursday
 *   02:30-03:00 hrs   Suprabhatam
 *   03:30-04:00 hrs   Thomala Seva
 *   ...
 */
export interface DayScheduleData {
  date:      string;           // IST date "2026-02-26"
  day:       string;           // Day name "Thursday"
  schedules: ScheduleEntry[];  // ordered list of time → event
}

export interface DayScheduleScrapeResult {
  success: boolean;
  data:    DayScheduleData | null;
  error:   string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Convert "26-02-2026" (DD-MM-YYYY) → "2026-02-26" */
function parseDdMmYyyy(raw: string): string {
  const m = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return raw.trim();
}

/** Time pattern: "02:30-03:00 hrs" or "00:45 hrs" */
const TIME_RE = /\d{1,2}:\d{2}\s*(?:-\s*\d{1,2}:\d{2})?\s*hrs/gi;

/** Day names */
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the Day Schedules block from tirumala.org.
 * Always resolves — never throws.
 */
export async function scrapeDaySchedule(): Promise<DayScheduleScrapeResult> {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();

    await page.goto('https://www.tirumala.org/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // Find the TD that contains "Day Schedules" and a date in DD-MM-YYYY format
    const rawText: string = await page.evaluate(() => {
      const td = Array.from(document.querySelectorAll('td')).find(
        (el) =>
          /Day Schedules/i.test(el.textContent ?? '') &&
          /\d{2}-\d{2}-\d{4}/.test(el.textContent ?? '')
      );
      return td ? (td.textContent ?? '').replace(/\s+/g, ' ').trim() : '';
    });

    if (!rawText) {
      return {
        success: false,
        data: null,
        error: 'Could not locate the "Day Schedules" block on tirumala.org.',
      };
    }

    // ── Extract date (DD-MM-YYYY) ──────────────────────────────────────────────
    const dateMatch = rawText.match(/(\d{2}-\d{2}-\d{4})/);
    if (!dateMatch) {
      return {
        success: false,
        data: null,
        error: `Found "Day Schedules" block but could not parse a date. Raw: "${rawText.slice(0, 200)}"`,
      };
    }
    const date = parseDdMmYyyy(dateMatch[1]);

    // ── Extract day name ───────────────────────────────────────────────────────
    const dayMatch = rawText.match(
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i
    );
    const day = dayMatch ? dayMatch[1] : '';

    // ── Extract schedule entries ───────────────────────────────────────────────
    // Slice text to just after the "header" (Day Schedules … date … day)
    // Pattern: "Day Schedules" block starts → strip header, then alternate time / event
    const afterHeader = rawText
      .replace(/.*?(Day Schedules)/i, '')  // drop everything before "Day Schedules"
      .replace(/Day Schedules/i, '')        // drop the heading itself
      .replace(dateMatch[1], '')            // drop the date
      .replace(/,?\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i, '')
      // stop at the next page section that follows the schedule block
      .replace(/\s*(Latest Updates|Notifications|S\.No\s+Content|prevnext).*/is, '')
      .trim();

    // Split on time patterns; tokens between them are event labels
    const times = [...afterHeader.matchAll(TIME_RE)].map((m) =>
      m[0].replace(/\s+/g, ' ').trim()
    );
    const events = afterHeader
      .split(TIME_RE)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    // times[0] lines up with events[0] (the text that immediately follows that time)
    // events[0] might be empty if text starts with a time — shift accordingly
    const schedules: ScheduleEntry[] = [];
    for (let i = 0; i < times.length; i++) {
      const event = (events[i] ?? '').trim();
      if (event) {
        schedules.push({ time: times[i], event });
      }
    }

    if (schedules.length === 0) {
      return {
        success: false,
        data: null,
        error: `Parsed date/day but found no schedule entries. Raw: "${rawText.slice(0, 300)}"`,
      };
    }

    return {
      success: true,
      data: { date, day, schedules },
      error: null,
    };
  } catch (err: unknown) {
    return { success: false, data: null, error: (err as Error).message };
  } finally {
    await browser.close();
  }
}
