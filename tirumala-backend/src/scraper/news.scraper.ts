import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One news article from https://news.tirumala.org/
 */
export interface NewsEntry {
  date:      string;  // ISO "2026-02-25"
  title:     string;  // full article title (bilingual)
  image_url: string;  // primary image src (600px version)
  link:      string;  // full article URL
}

export interface NewsScrapeResult {
  success: boolean;
  data:    NewsEntry[];
  error:   string | null;
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the latest news articles from the TTD news home page:
 *   https://news.tirumala.org/
 *
 * Targets <article> elements that have a post-image figure and a post-title h2.
 * Returns up to 20 entries, newest first.
 * Always resolves — never throws.
 */
export async function scrapeLatestNews(): Promise<NewsScrapeResult> {
  try {
    const { data: html } = await http.get<string>('https://news.tirumala.org/');
    const $ = cheerio.load(html);

    const entries: NewsEntry[] = [];
    const seen = new Set<string>();

    $('article').each((_, el) => {
      if (entries.length >= 20) return false;

      const date  = $(el).find('time[datetime]').attr('datetime') ?? '';
      const titleEl = $(el).find('h2.post-title a, h2.entry-title a').first();
      const title = titleEl.text().replace(/\s+/g, ' ').trim();
      const link  = titleEl.attr('href') ?? '';

      if (!date || !title || !link || seen.has(link)) return;
      seen.add(link);

      // Image: prefer data-src (lazy-loaded) then src; fall back to srcset first entry
      const imgEl = $(el).find('figure img.wp-post-image').first();
      let image_url =
        imgEl.attr('data-src') ??
        imgEl.attr('src') ?? '';

      if (!image_url.startsWith('http')) {
        const srcset = imgEl.attr('srcset') ?? imgEl.attr('data-srcset') ?? '';
        const first  = srcset.split(',')[0]?.trim().split(' ')[0] ?? '';
        if (first.startsWith('http')) image_url = first;
      }

      entries.push({ date, title, image_url, link });
    });

    if (entries.length === 0) {
      return {
        success: false,
        data: [],
        error: 'No news articles found on news.tirumala.org. Selector may have changed.',
      };
    }

    return { success: true, data: entries, error: null };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
