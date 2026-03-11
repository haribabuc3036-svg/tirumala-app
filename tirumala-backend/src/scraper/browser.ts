import { chromium, Browser } from 'playwright';

/**
 * Chromium launch flags required for headless operation inside Docker /
 * Render containers.
 *
 * --disable-dev-shm-usage   Docker limits /dev/shm to 64 MB; without this
 *                            flag Chromium writes large shared-memory buffers
 *                            there and immediately OOMs.
 * --no-sandbox              Required when running as root (Render default).
 * --disable-setuid-sandbox  Belt-and-suspenders companion to --no-sandbox.
 * --disable-gpu             No GPU available in a headless container.
 * --no-zygote               Skip the zygote process to reduce memory.
 * --single-process          Run renderer in the browser process; lowers RAM
 *                            significantly on memory-constrained hosts.
 */
export const CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-zygote',
  '--single-process',
];

/**
 * A realistic desktop User-Agent helps avoid WAF blocks on Indian govt sites
 * that reject requests without a common UA string.
 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Singleton browser instance ────────────────────────────────────────────────

let instance: Browser | null = null;
let launching = false;
const queue: Array<(b: Browser) => void> = [];

/**
 * Return (or lazily create) a single shared Playwright Browser process.
 *
 * All scrapers should call this instead of `chromium.launch()` so only one
 * Chromium process exists at a time — critical on 512 MB Render free tier.
 *
 * Each scraper is responsible for creating its own `BrowserContext` via
 * `browser.newContext()` and closing it when done; that gives full isolation
 * (cookies, localStorage, etc.) without spawning a new browser process.
 */
export async function getBrowser(): Promise<Browser> {
  if (instance?.isConnected()) return instance;

  if (launching) {
    return new Promise<Browser>((resolve) => queue.push(resolve));
  }

  launching = true;
  instance = await chromium.launch({ headless: true, args: CHROMIUM_ARGS });

  // If the browser crashes, clear the reference so the next call re-launches.
  instance.on('disconnected', () => {
    instance = null;
    launching = false;
  });

  launching = false;
  for (const cb of queue) cb(instance);
  queue.length = 0;

  return instance;
}
