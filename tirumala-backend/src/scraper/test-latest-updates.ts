import { scrapeLatestUpdates } from './latest-updates.scraper';

(async () => {
  console.log('📋  Scraping Latest Updates from ttdevasthanams.ap.gov.in...\n');

  const result = await scrapeLatestUpdates();

  if (!result.success || result.data.length === 0) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log(`✅  Parsed ${result.data.length} entries:\n`);
  result.data.forEach(({ text }, i) => {
    console.log(`[${String(i + 1).padStart(2, '0')}] ${text.slice(0, 120)}${text.length > 120 ? '…' : ''}`);
    console.log();
  });
})();
