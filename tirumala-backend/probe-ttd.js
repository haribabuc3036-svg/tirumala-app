const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function main() {
  const { data: html } = await axios.get('https://ttdevasthanams.ap.gov.in/home/dashboard', {
    httpsAgent: agent,
    timeout: 30000,
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,*/*',
      'Accept-Language': 'en-IN,en;q=0.9',
    }
  });

  // __NEXT_DATA__
  const nd = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nd) {
    const obj = JSON.parse(nd[1]);
    console.log('=== __NEXT_DATA__ keys:', Object.keys(obj));
    console.log('=== buildId:', obj.buildId);
    console.log('=== props.pageProps keys:', obj.props && obj.props.pageProps ? Object.keys(obj.props.pageProps) : 'none');
    console.log('=== full pageProps (truncated 3000):', JSON.stringify(obj.props?.pageProps ?? {}).substring(0, 3000));
    
    // Try page-data endpoint
    if (obj.buildId) {
      try {
        const url = `https://ttdevasthanams.ap.gov.in/_next/data/${obj.buildId}/home/dashboard.json`;
        console.log('\n=== trying:', url);
        const { data } = await axios.get(url, { httpsAgent: agent, timeout: 15000, headers: { 'User-Agent': UA } });
        console.log('=== /_next/data/ response (3000):', JSON.stringify(data).substring(0, 3000));
      } catch(e) {
        console.log('=== /_next/data/ failed:', e.message);
      }
    }
  } else {
    console.log('No __NEXT_DATA__ found');
  }

  // Script sources  
  const scripts = [];
  html.replace(/src="([^"]+\.js[^"]*)"/g, (_, s) => scripts.push(s));
  console.log('\n=== JS bundles (first 15):', scripts.slice(0, 15).join('\n'));

  // Any fetch/api references in the HTML
  const apis = [];
  html.replace(/"(\/api\/[^"]+)"/g, (_, s) => apis.push(s));
  html.replace(/"(https?:\/\/[^"]+\/api\/[^"]+)"/g, (_, s) => apis.push(s));
  console.log('\n=== API refs in HTML:', apis.slice(0, 20));

  // Body preview
  console.log('\n=== HTML body (first 3000):\n', html.substring(0, 3000));
}

main().catch(e => console.error('ERROR:', e.message));
