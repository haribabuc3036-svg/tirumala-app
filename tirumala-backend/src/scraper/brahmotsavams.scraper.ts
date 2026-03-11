import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One TTD Brahmotsavam entry scraped from news.tirumala.org/category/brahmotsavams/
 */
export interface BrahmotsavamEntry {
  title: string;           // event headline
  link:  string;           // URL to full article
  date:  string;           // ISO date string e.g. "2026-03-11T14:22:47"
}

export interface BrahmotsavamsScrapeResult {
  success: boolean;
  data:    BrahmotsavamEntry[];
  error:   string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface WpPost {
  id:    number;
  title: { rendered: string };
  date:  string;
  link:  string;
}

interface WpCategory {
  id:   number;
  slug: string;
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

const WP_API           = 'https://news.tirumala.org/wp-json/wp/v2';
const RSS_BRAHMOTSAVAMS = 'https://news.tirumala.org/category/brahmotsavams/feed/';

/**
 * Scrape Brahmotsavam news/updates from news.tirumala.org/category/brahmotsavams/
 *
 * Strategy 1: WP REST API — resolve category slug → ID → fetch posts
 * Strategy 2: Category RSS feed fallback
 *
 * Always resolves — never throws.
 */
export async function scrapeBrahmotsavams(): Promise<BrahmotsavamsScrapeResult> {
  // ── Strategy 1: WP REST API ────────────────────────────────────────────────
  try {
    // Step 1a: resolve "brahmotsavams" category ID
    const { data: cats } = await http.get<WpCategory[]>(
      `${WP_API}/categories?slug=brahmotsavams&_fields=id,slug`,
    );

    const categoryId = Array.isArray(cats) && cats.length > 0 ? cats[0].id : null;

    if (categoryId != null) {
      // Step 1b: fetch posts in the brahmotsavams category
      const { data: posts } = await http.get<WpPost[]>(
        `${WP_API}/posts?categories=${categoryId}&per_page=20&orderby=date&order=desc&_fields=id,title,date,link`,
      );

      if (Array.isArray(posts) && posts.length > 0) {
        const entries: BrahmotsavamEntry[] = posts
          .map((post) => ({
            title: decodeHtmlEntities(post.title?.rendered ?? ''),
            link:  post.link ?? '',
            date:  post.date ?? '',
          }))
          .filter((e) => e.title.length > 0 && e.link.length > 0);

        if (entries.length > 0) {
          return { success: true, data: entries, error: null };
        }
      }
    }
  } catch {
    // fall through to RSS
  }

  // ── Strategy 2: Category RSS feed ─────────────────────────────────────────
  try {
    const { data: xml } = await http.get<string>(RSS_BRAHMOTSAVAMS);
    const $ = cheerio.load(xml, { xmlMode: true });

    const entries: BrahmotsavamEntry[] = [];
    $('item').each((_, el) => {
      const title   = $('title', el).first().text().replace(/\s+/g, ' ').trim();
      const link    = ($('link', el).text() || $('guid', el).text()).trim();
      const pubDate = $('pubDate', el).text().trim();
      const isoDate = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();

      if (title.length > 0 && link.length > 0) {
        entries.push({ title, link, date: isoDate });
      }
    });

    if (entries.length > 0) {
      return { success: true, data: entries, error: null };
    }

    return { success: false, data: [], error: 'Brahmotsavams RSS feed returned no items.' };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
