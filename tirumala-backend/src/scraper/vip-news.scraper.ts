import * as cheerio from 'cheerio';
import { http } from './browser';

export interface VipNewsEntry {
  title: string;
  link:  string;
  date:  string;
}

export interface VipNewsScrapeResult {
  success: boolean;
  data:    VipNewsEntry[];
  error:   string | null;
}

interface WpPost { id: number; title: { rendered: string }; date: string; link: string; }
interface WpCategory { id: number; slug: string; }

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…').replace(/&#[0-9]+;/g, '').trim();
}

const WP_API  = 'https://news.tirumala.org/wp-json/wp/v2';
const RSS_URL = 'https://news.tirumala.org/category/vip/feed/';

export async function scrapeVipNews(): Promise<VipNewsScrapeResult> {
  try {
    const { data: cats } = await http.get<WpCategory[]>(
      `${WP_API}/categories?slug=vip&_fields=id,slug`,
    );
    const categoryId = Array.isArray(cats) && cats.length > 0 ? cats[0].id : null;
    if (categoryId != null) {
      const { data: posts } = await http.get<WpPost[]>(
        `${WP_API}/posts?categories=${categoryId}&per_page=20&orderby=date&order=desc&_fields=id,title,date,link`,
      );
      if (Array.isArray(posts) && posts.length > 0) {
        const entries: VipNewsEntry[] = posts
          .map((p) => ({ title: decodeHtmlEntities(p.title?.rendered ?? ''), link: p.link ?? '', date: p.date ?? '' }))
          .filter((e) => e.title.length > 0 && e.link.length > 0);
        if (entries.length > 0) return { success: true, data: entries, error: null };
      }
    }
  } catch { /* fall through */ }

  try {
    const { data: xml } = await http.get<string>(RSS_URL);
    const $ = cheerio.load(xml, { xmlMode: true });
    const entries: VipNewsEntry[] = [];
    $('item').each((_, el) => {
      const title   = $('title', el).first().text().replace(/\s+/g, ' ').trim();
      const link    = ($('link', el).text() || $('guid', el).text()).trim();
      const pubDate = $('pubDate', el).text().trim();
      const isoDate = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString();
      if (title.length > 0 && link.length > 0) entries.push({ title, link, date: isoDate });
    });
    if (entries.length > 0) return { success: true, data: entries, error: null };
    return { success: false, data: [], error: 'VIP RSS feed returned no items.' };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
