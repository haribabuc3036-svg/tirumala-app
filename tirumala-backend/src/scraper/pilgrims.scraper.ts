import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * One day's darshan statistics from https://news.tirumala.org/category/darshan/
 *
 * Example source text:
 *   "Total pilgrims who had darshan on 24.02.2026: 74,902
 *    Tonsures : 22,869  Hundi kanukalu : 4.05CR
 *    Waiting Compartments…25.
 *    Approx. Darsan Time for Sarvadarshanam (with out SSD Tokens).. 12H"
 */
export interface PilgrimEntry {
  date:         string;  // ISO "2026-02-24"
  pilgrims:     string;  // "74,902"
  tonsures:     string;  // "22,869"
  hundi:        string;  // "4.05 CR"
  waiting:      string;  // "25" | "Outside line at Krishna Teja Guest house"
  darshan_time: string;  // "12H" | "18-20H"
}

export interface PilgrimsScrapeResult {
  success: boolean;
  data:    PilgrimEntry[];
  error:   string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** "24.02.2026" → "2026-02-24" */
function parseDotDate(raw: string): string {
  const m = raw.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return raw.trim();
}

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a single article's body text into a PilgrimEntry.
 * Returns null if it cannot parse the core date+pilgrims fields.
 */
function parseArticle(text: string): PilgrimEntry | null {
  // Date + pilgrims
  const headerMatch = text.match(
    /Total pilgrims who had darshan on\s+([\d.]+)\s*:\s*([\d,]+)/i
  );
  if (!headerMatch) return null;

  const date     = parseDotDate(headerMatch[1]);
  const pilgrims = clean(headerMatch[2]);

  // Tonsures: "22,869" or "28,049"
  const tonsuresMatch = text.match(/Tonsures\s*:?\s*([\d,]+)/i);
  const tonsures = tonsuresMatch ? clean(tonsuresMatch[1]) : '';

  // Hundi: "4.05CR" | "4.05 CR" | "3.46 CR"
  const hundiMatch = text.match(/Hundi kanukalu\s*:?\s*([\d.]+\s*CR)/i);
  const hundi = hundiMatch ? clean(hundiMatch[1]).toUpperCase() : '';

  // Waiting: after "Waiting Compartments…" — grab until next sentence or end
  //   e.g. "25." | "Outside line at Krishna Teja Guest house."
  const waitingMatch = text.match(
    /Waiting Compartments[…\.]+\s*(.+?)(?=Approx\.|$)/is
  );
  const waitingRaw = waitingMatch
    ? clean(waitingMatch[1]).replace(/\.$/, '')
    : '';
  // If it's a bare number (e.g. "18", "04"), label it as "18 Compartments"
  const waiting = /^\d+$/.test(waitingRaw)
    ? `${waitingRaw} Compartments`
    : waitingRaw;

  // Darshan time: "12H" | "18-20H" | "8-10 H" | "10-12H"
  const timeMatch = text.match(
    /Approx\.?\s*Darsan Time[^.]+\.{2,}\s*([\d\s\-–]+H)/i
  );
  const darshan_time = timeMatch ? clean(timeMatch[1]) : '';

  return { date, pilgrims, tonsures, hundi, waiting, darshan_time };
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the most recent darshan statistics from:
 *   https://news.tirumala.org/category/darshan/
 *
 * Returns up to 10 entries, newest first.
 * Always resolves — never throws.
 */
export async function scrapePilgrimsFromTirumala(): Promise<PilgrimsScrapeResult> {
  try {
    const { data: html } = await http.get<string>('https://news.tirumala.org/category/darshan/');
    const $ = cheerio.load(html);

    const articleTexts: string[] = [];
    $('article').each((_, el) => {
      articleTexts.push($(el).text().replace(/\s+/g, ' ').trim());
    });

    if (articleTexts.length === 0) {
      return {
        success: false,
        data: [],
        error: 'No <article> elements found on the darshan news page.',
      };
    }

    const entries: PilgrimEntry[] = [];
    for (const text of articleTexts) {
      if (!/Total pilgrims/i.test(text)) continue;
      const entry = parseArticle(text);
      if (entry) entries.push(entry);
      if (entries.length >= 10) break;
    }

    if (entries.length === 0) {
      return {
        success: false,
        data: [],
        error: 'Found articles but could not parse any darshan entries.',
      };
    }

    return { success: true, data: entries, error: null };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}
