/**
 * Quick test — run with:
 *   npx ts-node src/scraper/test-ssd.ts
 */
import { scrapeSsdFromTirumala } from './ssd.scraper';

(async () => {
  console.log('🔍 Scraping tirumala.org...\n');
  const result = await scrapeSsdFromTirumala();

  if (!result.success) {
    console.error('❌ Scrape failed:', result.error);
    process.exit(1);
  }

  console.log('✅ Success!\n');
  console.log(JSON.stringify(result.data, null, 2));
})();
