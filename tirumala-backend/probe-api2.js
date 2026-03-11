const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ax = axios.create({ httpsAgent: agent, timeout: 15000, headers: { 'User-Agent': UA } });

const candidates = [
  'https://services.tirupatibalaji.ap.gov.in/universal-latest-updates?populate=*',
  'https://services.tirupatibalaji.ap.gov.in/api/universal-latest-updates?populate=*',
  'https://services.tirupatibalaji.ap.gov.in/cms/api/universal-latest-updates?populate=*',
  'https://services.tirupatibalaji.ap.gov.in/cms/universal-latest-updates?populate=*',
  // Also try top-level to see what the server returns at /
  'https://services.tirupatibalaji.ap.gov.in/',
  'https://services.tirupatibalaji.ap.gov.in/api/',
  'https://services.tirupatibalaji.ap.gov.in/cms/api/',
];

async function main() {
  for (const url of candidates) {
    try {
      const { data, status } = await ax.get(url);
      console.log(`\n=== ${url}`);
      console.log('Status:', status);
      console.log('Data:', JSON.stringify(data).substring(0, 500));
    } catch(e) {
      console.log(`\nFAIL ${url} -> ${e.response?.status ?? e.code}: ${e.message.substring(0,80)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

main();
