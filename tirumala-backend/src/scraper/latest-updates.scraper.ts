import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One entry from the "Latest Updates" ticker on ttdevasthanams.ap.gov.in
 */
export interface LatestUpdateEntry {
  text: string;  // cleaned text content of the update item
}

export interface LatestUpdatesScrapeResult {
  success: boolean;
  data:    LatestUpdateEntry[];
  error:   string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const BASE = 'https://ttdevasthanams.ap.gov.in';

/** Walk any JSON value and collect strings that look like update sentences. */
function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    const t = value.replace(/\s+/g, ' ').trim();
    if (t.length >= 15) out.push(t);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectStrings(v, out));
  } else if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) => collectStrings(v, out));
  }
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the "Latest Updates" list from ttdevasthanams.ap.gov.in.
 *
 * Strategies (attempted in order):
 *  1. CSS-module class selector in the SSR HTML
 *  2. Generic list/ticker selectors
 *  3. Next.js page-data endpoint  /_next/data/{buildId}/home/dashboard.json
 *  4. Walk all __NEXT_DATA__ props for strings ≥ 15 chars
 *  5. Scan inline <script> tags for JSON arrays of strings
 *
 * Always resolves — never throws.
 */
export async function scrapeLatestUpdates(): Promise<LatestUpdatesScrapeResult> {
  try {
    const { data: html } = await http.get<string>(`${BASE}/home/dashboard`);
    const $ = cheerio.load(html);
    const items: string[] = [];

    // ── Strategy 1: CSS-module class pattern ──────────────────────────────────
    $('[class*="latestUpdates"]').each((_, el) => {
      $(el).find('li, p, span, a').addBack('li, p, span, a').each((__, child) => {
        const text = $(child).text().replace(/\s+/g, ' ').trim();
        if (text.length >= 15) items.push(text);
      });
    });

    // ── Strategy 2: Generic ticker / marquee / announcement selectors ─────────
    if (items.length === 0) {
      const genericSelectors = [
        '[class*="ticker"]',
        '[class*="marquee"]',
        '[class*="announcement"]',
        '[class*="notice"]',
        '[class*="update"]',
        '.latest-updates li',
        '#latestUpdates li',
        'marquee',
      ];
      for (const sel of genericSelectors) {
        $(sel).each((_, el) => {
          const text = $(el).text().replace(/\s+/g, ' ').trim();
          if (text.length >= 15) items.push(text);
        });
        if (items.length > 0) break;
      }
    }

    // ── Strategy 3: Next.js /_next/data/{buildId}/ page-data endpoint ─────────
    if (items.length === 0) {
      const nextDataRaw = $('#__NEXT_DATA__').html();
      if (nextDataRaw) {
        try {
          const nextData = JSON.parse(nextDataRaw) as Record<string, unknown>;
          const buildId = nextData['buildId'] as string | undefined;

          if (buildId) {
            try {
              const pageDataUrl = `${BASE}/_next/data/${buildId}/home/dashboard.json`;
              const { data: pageData } = await http.get<unknown>(pageDataUrl);
              collectStrings((pageData as Record<string, unknown>)['pageProps'], items);
            } catch {
              // /_next/data endpoint not available — continue
            }
          }

          // ── Strategy 4: Walk all __NEXT_DATA__ props ─────────────────────
          if (items.length === 0) {
            const props = (nextData['props'] as Record<string, unknown> | undefined)?.['pageProps'];
            if (props) collectStrings(props, items);
          }
        } catch {
          // JSON parse failed — continue
        }
      }
    }

    // ── Strategy 5: Scan inline <script> tags for JSON arrays ─────────────────
    if (items.length === 0) {
      $('script:not([src])').each((_, el) => {
        const src = $(el).html() ?? '';
        // Look for arrays of objects/strings embedded in JS assignments
        const arrayMatches = src.matchAll(/=\s*(\[[\s\S]{20,2000}?\])\s*[;,)]/g);
        for (const m of arrayMatches) {
          try {
            const parsed: unknown = JSON.parse(m[1]);
            collectStrings(parsed, items);
          } catch {
            // not valid JSON — skip
          }
        }
      });
    }

    // Deduplicate while preserving order
    const unique = [...new Set(items)];

    if (unique.length === 0) {
      return {
        success: false,
        data: [],
        error:
          'No latest-update items found on ttdevasthanams.ap.gov.in — ' +
          'the page appears to be fully client-side rendered.',
      };
    }

    return {
      success: true,
      data: unique.map((text) => ({ text })),
      error: null,
    };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
