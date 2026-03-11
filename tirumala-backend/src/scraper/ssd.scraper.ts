import * as cheerio from 'cheerio';
import { http } from './browser';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Structured data from the "Slotted Sarva Darshan" block on tirumala.org
 *
 * Source: https://www.tirumala.org/ → TIRUMALA UPDATES → Slotted Sarva Darshan
 *
 * Live text on page:
 *   Running Slot: 1 on 27-Feb-2026
 *   Balance tickets for 27-Feb-2026: 0
 */
export interface SsdScrapedData {
  running_slot: string;   // e.g. "1"
  slot_date: string;      // e.g. "27-Feb-2026"
  balance_date: string;   // e.g. "27-Feb-2026"
  balance_tickets: string;// e.g. "0", "1,240"
}

export interface SsdScrapeResult {
  success: boolean;
  data: SsdScrapedData | null;
  error: string | null;
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

/**
 * Scrape the Slotted Sarva Darshan (SSD) token status live from tirumala.org.
 *
 * Uses Playwright headless Chromium so JavaScript-rendered content is captured.
 * Always resolves — never throws.
 *
 * @returns SsdScrapeResult
 */
export async function scrapeSsdFromTirumala(): Promise<SsdScrapeResult> {
  try {
    const { data: html } = await http.get<string>('https://www.tirumala.org/');
    const $ = cheerio.load(html);

    // Find the <td> that contains both "Running Slot" and "Balance tickets"
    let rawText = '';
    $('td').each((_, el) => {
      const text = $(el).text();
      if (/Running Slot/i.test(text) && /Balance tickets/i.test(text)) {
        rawText = text.replace(/\s+/g, ' ').trim();
        return false; // break
      }
    });

    if (!rawText) {
      return {
        success: false,
        data: null,
        error:
          'Could not locate the "Slotted Sarva Darshan" table on tirumala.org. ' +
          'The page structure may have changed.',
      };
    }

    const slotMatch    = rawText.match(/Running Slot[:\s]+(.+?)\s+on\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i);
    const balanceMatch = rawText.match(/Balance tickets for\s+(\d{1,2}-[A-Za-z]{3}-\d{4})\s*:\s*([\d,]+)/i);

    if (!slotMatch) {
      return {
        success: false,
        data: null,
        error: `Found the table but could not parse "Running Slot". Raw: "${rawText.slice(0, 300)}"`,
      };
    }

    return {
      success: true,
      data: {
        running_slot:    slotMatch[1].trim(),
        slot_date:       slotMatch[2].trim(),
        balance_date:    balanceMatch ? balanceMatch[1].trim() : slotMatch[2].trim(),
        balance_tickets: balanceMatch ? balanceMatch[2].trim() : '0',
      },
      error: null,
    };
  } catch (err: unknown) {
    return { success: false, data: null, error: (err as Error).message };
  }
}
