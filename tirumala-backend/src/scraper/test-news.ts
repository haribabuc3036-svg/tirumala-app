import { scrapeLatestNews } from './news.scraper';

(async () => {
  console.log('📰  Scraping Latest News from news.tirumala.org...\n');

  const result = await scrapeLatestNews();

  if (!result.success || result.data.length === 0) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  console.log(`✅  Parsed ${result.data.length} articles:\n`);
  result.data.forEach(({ date, title, image_url, link }, i) => {
    console.log(`[${String(i + 1).padStart(2, '0')}] ${date}`);
    console.log(`     Title : ${title.slice(0, 100)}${title.length > 100 ? '…' : ''}`);
    console.log(`     Image : ${image_url.slice(0, 80)}${image_url.length > 80 ? '…' : ''}`);
    console.log(`     Link  : ${link.slice(0, 80)}${link.length > 80 ? '…' : ''}`);
    console.log();
  });
})();
