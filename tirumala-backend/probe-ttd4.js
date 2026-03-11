const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://ttdevasthanams.ap.gov.in';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ax = axios.create({ 
  httpsAgent: agent, 
  timeout: 20000, 
  headers: { 
    'User-Agent': UA,
    'Referer': BASE + '/home/dashboard',
    'Accept': '*/*',
    'Accept-Language': 'en-IN,en;q=0.9',
  } 
});

async function main() {
  const url = `${BASE}/_next/static/chunks/8180-9c5b88d17a94cd99.js`;
  try {
    const { data: code, status } = await ax.get(url);
    console.log('Status:', status, 'Length:', code.length);
    
    // All https URLs
    const urls = new Set();
    code.replace(/["'`](https?:\/\/[^"'`\s\\]{5,})["'`]/g, (_, u) => urls.add(u));
    console.log('HTTPS URLs:', [...urls]);
    
    // concat fragments
    const frags = new Set();
    code.replace(/concat\([^,)]+,\s*"([^"]{5,})"/g, (_, p) => frags.add(p));
    code.replace(/concat\([^,)]+,\s*'([^']{5,})'/g, (_, p) => frags.add(p));
    console.log('concat fragments:', [...frags]);
    
    // Context around latestUpdate
    let idx = code.indexOf('latestUpdate');
    while (idx >= 0 && idx < code.length) {
      console.log('\nHIT at', idx, ':', code.substring(Math.max(0,idx-100), idx+300));
      idx = code.indexOf('latestUpdate', idx+1);
      if (idx > 150000) break; // avoid infinite loops on huge file
    }
    
  } catch(e) {
    console.log('Fetch error:', e.response?.status, e.message);
    // Try with different chunk
    const chunks = [
      '/_next/static/chunks/fec483df-4ee39df0479bd80b.js',
      '/_next/static/chunks/8456-68451e5bfd33f7c1.js',
      '/_next/static/chunks/2270-9011959a8b02c4e1.js',
    ];
    for (const c of chunks) {
      try {
        const { data, status: s } = await ax.get(BASE + c);
        if (typeof data === 'string' && data.includes('latestUpdate')) {
          console.log(`\n${c} HAS latestUpdate!`);
          const i = data.indexOf('latestUpdate');
          console.log(data.substring(Math.max(0,i-200), i+500));
          const urls2 = new Set();
          data.replace(/["'`](https?:\/\/[^"'`\s\\]{5,})["'`]/g, (_,u) => urls2.add(u));
          console.log('URLs:', [...urls2]);
        }
      } catch(e2) { console.log(c, '->', e2.message); }
    }
  }
}

main().catch(e => console.error(e));
