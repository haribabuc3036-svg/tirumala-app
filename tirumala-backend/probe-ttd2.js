const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://ttdevasthanams.ap.gov.in';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ax = axios.create({ httpsAgent: agent, timeout: 15000, headers: { 'User-Agent': UA } });

async function fetchText(url) {
  try { const { data } = await ax.get(url); return typeof data === 'string' ? data : JSON.stringify(data); }
  catch(e) { return null; }
}

async function main() {
  // Get all JS chunks from the page
  const { data: html } = await ax.get(`${BASE}/home/dashboard`);
  const chunks = [];
  html.replace(/\/_next\/static\/chunks\/[^"'\s]+\.js[^"'\s]*/g, (m) => chunks.push(m));
  // Also pages chunks
  html.replace(/\/_next\/static\/chunks\/pages\/[^"'\s]+/g, (m) => chunks.push(m));

  // Deduplicate
  const unique = [...new Set(chunks)];
  console.log('Total chunks:', unique.length);

  // Scan each chunk for API patterns
  const keywords = ['latestUpdate', 'latest_update', 'LatestUpdate', 'latest-update', 
                    '/api/', 'fetchData', 'getLatest', 'dashboard', 'notices', 'announcements',
                    'updates', 'ticker', 'marquee'];
  
  for (const chunk of unique) {
    const url = BASE + chunk;
    const code = await fetchText(url);
    if (!code) continue;
    
    const found = keywords.filter(k => code.toLowerCase().includes(k.toLowerCase()));
    if (found.length > 0) {
      console.log(`\n=== CHUNK: ${chunk} (matched: ${found.join(', ')})`);
      
      // Extract API endpoint patterns
      const apiPatterns = [];
      code.replace(/["'`](\/api\/[^"'`\s\\]{3,})/g, (_, p) => apiPatterns.push(p));
      code.replace(/["'`](https?:\/\/[^"'`\s\\]{10,}\/api\/[^"'`\s\\]+)/g, (_, p) => apiPatterns.push(p));
      // Also look for fetch/axios calls with relative URLs
      code.replace(/fetch\s*\(\s*["'`](\/[^"'`]+)["'`]/g, (_, p) => apiPatterns.push(p));
      code.replace(/axios[.\w]+\s*\(\s*["'`](\/[^"'`]+)["'`]/g, (_, p) => apiPatterns.push(p));
      
      if (apiPatterns.length > 0) {
        console.log('  API patterns:', [...new Set(apiPatterns)].join('\n  '));
      }
      
      // Print surrounding context for "latestUpdate" hits
      const idx = code.toLowerCase().indexOf('latestupdate');
      if (idx >= 0) {
        console.log('  latestUpdate context:', code.substring(Math.max(0,idx-200), idx+400));
      }
      
      // Print surrounding context for "/api/" hits
      const apiIdx = code.indexOf('/api/');
      if (apiIdx >= 0) {
        console.log('  /api/ context:', code.substring(Math.max(0,apiIdx-100), apiIdx+300));
      }
    }
  }
  
  // Also try common TTD API endpoints directly
  const tryEndpoints = [
    '/api/dashboard/latestUpdates',
    '/api/latestUpdates',
    '/api/latest-updates',
    '/api/home/latest-updates',
    '/api/getLatestUpdates',
    '/api/home/dashboard',
    '/api/notices',
    '/api/announcements',
  ];
  console.log('\n=== Probing common API endpoints:');
  for (const ep of tryEndpoints) {
    try {
      const { data, status } = await ax.get(BASE + ep);
      console.log(`  ${ep} -> ${status}:`, JSON.stringify(data).substring(0, 200));
    } catch(e) {
      console.log(`  ${ep} -> ${e.response?.status ?? e.code}: ${e.message.substring(0, 80)}`);
    }
  }
}

main().catch(e => console.error('ERROR:', e.message, e.stack));
