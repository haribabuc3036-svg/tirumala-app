import { scrapeDaySchedule } from './schedule.scraper';

(async () => {
  console.log('📅  Scraping Day Schedule from tirumala.org...\n');

  const result = await scrapeDaySchedule();

  if (!result.success || !result.data) {
    console.error('❌ Failed:', result.error);
    process.exit(1);
  }

  const { date, day, schedules } = result.data;
  console.log(`✅  Date : ${date}`);
  console.log(`    Day  : ${day}`);
  console.log(`    Items: ${schedules.length}\n`);
  schedules.forEach(({ time, event }) => {
    console.log(`  ${time.padEnd(22)} ${event}`);
  });
})();
