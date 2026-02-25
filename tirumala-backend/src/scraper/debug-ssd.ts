import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Loading tirumala.org...');
  await page.goto('https://www.tirumala.org/', { waitUntil: 'networkidle', timeout: 30_000 });

  // 1. List all frames
  const frames = page.frames();
  console.log(`\nTotal frames: ${frames.length}`);
  frames.forEach((f, i) => console.log(`  Frame ${i}: ${f.url()}`));

  // 2. Check main frame body text
  const bodyText: string = await page.evaluate(() => document.body.innerText);

  const hasRunningSlot = bodyText.includes('Running Slot');
  const hasSlotted     = bodyText.includes('Slotted');
  const hasBalance     = bodyText.includes('Balance tickets');
  console.log(`\nMain frame contains:`);
  console.log(`  "Running Slot"    : ${hasRunningSlot}`);
  console.log(`  "Slotted"         : ${hasSlotted}`);
  console.log(`  "Balance tickets" : ${hasBalance}`);

  // 3. Search every frame for our keywords
  console.log('\nSearching all frames for "Running Slot"...');
  for (let i = 0; i < frames.length; i++) {
    try {
      const text: string = await frames[i].evaluate(() => document.body?.innerText ?? '');
      if (text.includes('Running Slot')) {
        console.log(`  ✅ FOUND in frame ${i}: ${frames[i].url()}`);
        // Extract surrounding context
        const idx = text.indexOf('Running Slot');
        console.log('  Context:', JSON.stringify(text.slice(Math.max(0, idx - 50), idx + 300)));
      }
    } catch (_) {}
  }

  // 4. Dump all table cells that mention slot/balance/ticket
  const cells: string[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll('td, th'))
      .map(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(t => /slot|balance|ticket|running|darshan/i.test(t) && t.length < 600)
  );
  console.log(`\nMatching TD/TH in main frame (${cells.length}):`);
  cells.forEach((c, i) => console.log(`  ${i}: ${JSON.stringify(c)}`));

  // 5. Write full body text to file for inspection
  fs.writeFileSync('debug-page.txt', bodyText, 'utf-8');
  console.log('\nFull page text written to: debug-page.txt');

  await browser.close();
})();
