import * as cheerio from 'cheerio';
import { http } from './browser';

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
  try {
    const { data: html } = await http.get<string>('https://ttdevasthanams.ap.gov.in/home/dashboard');
    const $ = cheerio.load(html);

    // Strategy 1: CSS-module class pattern in SSR HTML
    const items: string[] = [];
    $('[class*="latestUpdates_update"]').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) items.push(text);
    });

    // Strategy 2: Parse __NEXT_DATA__ JSON (Next.js SSR embeds page props here)
    if (items.length === 0) {
      const nextDataRaw = $('#__NEXT_DATA__').html();
      if (nextDataRaw) {
        try {
          const nextData = JSON.parse(nextDataRaw);
          // Walk the props tree looking for arrays of update-like objects
          const str = JSON.stringify(nextData);
          const matches = [...str.matchAll(/"(?:text|title|message|update|content)":"([^"]{10,})"/g)];
          for (const m of matches) {
            const text = m[1].replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
            if (text) items.push(text);
          }
        } catch {
          // JSON parse failed — ignore
        }
      }
    }

    if (items.length === 0) {
      return {
        success: false,
        data: [],
        error:
          'No latest-update items found on ttdevasthanams.ap.gov.in. ' +
          'The page may be fully client-side rendered or the selector has changed.',
      };
    }

    return {
      success: true,
      data: items.map((text) => ({ text })),
      error: null,
    };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
