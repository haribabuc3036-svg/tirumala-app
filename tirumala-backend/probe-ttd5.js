const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://ttdevasthanams.ap.gov.in';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  await sleep(3000); // wait before hammering again
  
  const ax = axios.create({ 
    httpsAgent: agent, 
    timeout: 25000,
    maxRedirects: 5,
    headers: { 
      'User-Agent': UA,
      'Referer': BASE + '/',
      'Accept': 'application/javascript, */*',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'script',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'same-origin',
    } 
  });

  const url = `${BASE}/_next/static/chunks/8180-9c5b88d17a94cd99.js`;
  console.log('Fetching', url);
  const { data: code, status } = await ax.get(url);
  console.log('Got', status, 'len=', code.length);

  // ── 1. HTTPS URLs ──────────────────────────────────────────────────────────
  const urls = new Set();
  code.replace(/["'](https?:\/\/[^"'\s\\]{5,})["']/g, (_, u) => urls.add(u));
  console.log('\n=== HTTPS URLs in chunk:\n', [...urls].join('\n'));

  // ── 2. concat fragments (API path pieces) ─────────────────────────────────
  const frags = new Set();
  code.replace(/\.concat\([^,)]+,\s*"([^"]{5,})"/g, (_, p) => frags.add(p));
  code.replace(/\.concat\([^,)]+,\s*'([^']{5,})'/g, (_, p) => frags.add(p));
  // simple string literals that look like API paths  
  code.replace(/"(\/[a-z][a-z0-9\-_/]{4,}(?:\?[^"]{3,})?)"/g, (_, p) => {
    if (!p.includes('_next') && !p.includes('.js') && !p.includes('.css') && !p.includes('.png')) frags.add(p);
  });
  console.log('\n=== Path/concat fragments:\n', [...frags].join('\n'));

  // ── 3. Large window around every latestUpdate hit ─────────────────────────
  let searchFrom = 0;
  let hitCount = 0;
  while (searchFrom < code.length && hitCount < 10) {
    const idx = code.toLowerCase().indexOf('latestupdate', searchFrom);
    if (idx < 0) break;
    console.log(`\n=== latestUpdate hit #${++hitCount} at pos ${idx}:`);
    console.log(code.substring(Math.max(0, idx - 300), idx + 600));
    searchFrom = idx + 1;
  }
  
  // ── 4. Also look for gN specifically ─────────────────────────────────────
  const gnIdx = code.indexOf('gN');
  if (gnIdx >= 0) {
    console.log('\n=== gN context:', code.substring(Math.max(0,gnIdx-50), gnIdx+200));
  }
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Status:', e.response.status, 'Headers:', JSON.stringify(e.response.headers));
});
