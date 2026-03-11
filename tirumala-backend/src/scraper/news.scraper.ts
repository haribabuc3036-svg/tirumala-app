import { getBrowser, USER_AGENT } from './browser';

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
  const browser = await getBrowser();
  const context = await browser.newContext({ userAgent: USER_AGENT });

  try {
    const page = await context.newPage();

    await page.goto('https://news.tirumala.org/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    const entries: NewsEntry[] = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll<HTMLElement>('article'));
      const seen = new Set<string>();
      const results: { date: string; title: string; image_url: string; link: string }[] = [];

      for (const article of articles) {
        // Date — from <time datetime="2026-02-25">
        const timeEl = article.querySelector<HTMLTimeElement>('time[datetime]');
        const date = timeEl?.getAttribute('datetime') ?? '';

        // Title & link — from <h2 class="post-title"> <a>
        const titleEl = article.querySelector<HTMLAnchorElement>('h2.post-title a, h2.entry-title a');
        const title = (titleEl?.textContent ?? '').replace(/\s+/g, ' ').trim();
        const link  = titleEl?.href ?? '';

        if (!date || !title || !link || seen.has(link)) continue;
        seen.add(link);

        // Image — prefer real http src; fall back to first srcset entry (real URL)
        // or the noscript fallback (for lazy-loaded images whose src is a placeholder SVG)
        const imgEl = article.querySelector<HTMLImageElement>('figure img.wp-post-image');
        let image_url = imgEl?.src ?? '';

        if (!image_url.startsWith('http')) {
          // Try srcset first entry ("https://...jpg 600w, ...")
          const srcset = imgEl?.getAttribute('srcset') ?? '';
          const srcsetFirst = srcset.split(',')[0]?.trim().split(' ')[0] ?? '';
          if (srcsetFirst.startsWith('http')) {
            image_url = srcsetFirst;
          } else {
            // Try noscript fallback img
            const noscript = article.querySelector('noscript');
            if (noscript) {
              const m = noscript.textContent?.match(/src="([^"]+)"/);
              if (m) image_url = m[1];
            }
          }
        }

        results.push({ date, title, image_url, link });
        if (results.length >= 20) break;
      }

      return results;
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
  } finally {
    await context.close();
  }
}
