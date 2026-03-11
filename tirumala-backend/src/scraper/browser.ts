import https from 'https';
import axios, { AxiosInstance } from 'axios';

/**
 * Shared axios instance used by all scrapers.
 * Sets a realistic browser User-Agent so WAFs on Indian govt / temple sites
 * don't block the request, and a 30-second timeout.
 *
 * rejectUnauthorized: false — several TTD / AP-govt sub-domains present
 * self-signed or incomplete certificate chains (e.g. news.tirumala.org).
 * We accept the risk here because we only read public, unauthenticated data.
 */
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export const http: AxiosInstance = axios.create({
  timeout: 30_000,
  httpsAgent,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,te;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});
