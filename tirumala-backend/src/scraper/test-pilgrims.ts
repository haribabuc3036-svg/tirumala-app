import { scrapePilgrimsFromTirumala } from './pilgrims.scraper';

(async () => {
  console.log('🛕  Scraping Darshan Pilgrims from news.tirumala.org...\n');

  const result = await scrapePilgrimsFromTirumala();

  if (!result.success || result.data.length === 0) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log(`✅  Parsed ${result.data.length} entries:\n`);
  console.log(
    ['date', 'pilgrims', 'tonsures', 'hundi', 'waiting', 'darshan_time']
      .map((h) => h.padEnd(22))
      .join('')
  );
  console.log('─'.repeat(132));
  for (const e of result.data) {
    console.log(
      [e.date, e.pilgrims, e.tonsures, e.hundi, e.waiting, e.darshan_time]
        .map((v) => v.padEnd(22))
        .join('')
    );
  }
})();
