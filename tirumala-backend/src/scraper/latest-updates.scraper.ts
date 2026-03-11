import { getBrowser, USER_AGENT } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One entry from the "Latest Updates" ticker on ttdevasthanams.ap.gov.in
 */
export interface LatestUpdateEntry {
  text: string;  // cleaned text content of the <li>
}

export interface LatestUpdatesScrapeResult {
  success: boolean;
  data:    LatestUpdateEntry[];
  error:   string | null;
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the "Latest Updates" list from:
 *   https://ttdevasthanams.ap.gov.in/home/dashboard
 *
 * The list lives in <ul class="latestUpdates_list__*"> — we use an attribute
 * contains selector so build-time CSS-module hash changes don't break us.
 *
 * Always resolves — never throws.
 */
export async function scrapeLatestUpdates(): Promise<LatestUpdatesScrapeResult> {
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });

  try {
    const page = await context.newPage();

    await page.goto('https://ttdevasthanams.ap.gov.in/home/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // Wait for at least one update item to appear (SPA may render after load)
    await page.waitForSelector('[class*="latestUpdates_update"]', {
      timeout: 20_000,
    }).catch(() => null); // don't throw if it times out — handled below

    const items: string[] = await page.evaluate(() => {
      const lis = Array.from(
        document.querySelectorAll<HTMLElement>('[class*="latestUpdates_update"]')
      );
      return lis.map((li) =>
        (li.textContent ?? '').replace(/\s+/g, ' ').trim()
      ).filter(Boolean);
    });

    if (items.length === 0) {
      return {
        success: false,
        data: [],
        error:
          'No latest-update items found on ttdevasthanams.ap.gov.in. ' +
          'The page may still be loading or the selector has changed.',
      };
    }

    return {
      success: true,
      data: items.map((text) => ({ text })),
      error: null,
    };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  } finally {
    await context.close();
  }
}
