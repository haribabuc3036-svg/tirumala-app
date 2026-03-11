import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One latest update entry (sourced from TTD news feed).
 */
export interface LatestUpdateEntry {
  text:  string;           // headline / update text
  link?: string;           // URL to the full article
  date?: string;           // ISO date string "2026-03-11T18:27:05"
}

export interface LatestUpdatesScrapeResult {
  success: boolean;
  data:    LatestUpdateEntry[];
  error:   string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface WpPost {
  id:     number;
  title:  { rendered: string };
  date:   string;
  link:   string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&#[0-9]+;/g, '')
    .trim();
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

const WP_API = 'https://news.tirumala.org/wp-json/wp/v2/posts';
const RSS_URL = 'https://news.tirumala.org/feed/';

/**
 * Scrape latest TTD updates from news.tirumala.org.
 *
 * Strategy 1: WordPress REST API  (clean JSON, returns up to 20 posts)
 * Strategy 2: RSS feed            (XML fallback)
 *
 * Always resolves — never throws.
 */
export async function scrapeLatestUpdates(): Promise<LatestUpdatesScrapeResult> {
  // ── Strategy 1: WP REST API ────────────────────────────────────────────────
  try {
    const { data } = await http.get<WpPost[]>(
      `${WP_API}?per_page=20&_fields=id,title,date,link`,
    );

    if (Array.isArray(data) && data.length > 0) {
      const entries: LatestUpdateEntry[] = data.map((post) => ({
        text: decodeHtmlEntities(post.title?.rendered ?? ''),
        link: post.link,
        date: post.date,
      })).filter((e) => e.text.length > 0);

      if (entries.length > 0) {
        return { success: true, data: entries, error: null };
      }
    }
  } catch {
    // fall through to RSS
  }

  // ── Strategy 2: RSS feed ───────────────────────────────────────────────────
  try {
    const { data: xml } = await http.get<string>(RSS_URL);
    const $ = cheerio.load(xml, { xmlMode: true });

    const entries: LatestUpdateEntry[] = [];
    $('item').each((_, el) => {
      const title = $('title', el).first().text().replace(/\s+/g, ' ').trim();
      const link  = ($('link', el).text() || $('guid', el).text()).trim();
      const date  = $('pubDate', el).text().trim();

      const isoDate = date ? new Date(date).toISOString() : undefined;

      if (title.length > 0) {
        entries.push({ text: title, link: link || undefined, date: isoDate });
      }
    });

    if (entries.length > 0) {
      return { success: true, data: entries, error: null };
    }

    return { success: false, data: [], error: 'RSS feed returned no items.' };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
