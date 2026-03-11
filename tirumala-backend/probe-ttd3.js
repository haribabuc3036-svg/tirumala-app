const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://ttdevasthanams.ap.gov.in';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ax = axios.create({ httpsAgent: agent, timeout: 15000, headers: { 'User-Agent': UA } });

async function main() {
  // Fetch the key chunk
  const url = `${BASE}/_next/static/chunks/8180-9c5b88d17a94cd99.js`;
  const { data: code } = await ax.get(url);
  
  // Find the gN / API base URL constant
  console.log('=== Looking for API base URL (gN) ===');
  // Pattern: gN:"https://..." or gN:e.NEXT_PUBLIC_...  
  const envMatches = code.match(/gN[:\s]*["'`](https?:\/\/[^"'`]{5,})["'`]/g);
  console.log('gN matches:', envMatches);
  
  // Broader search for https URLs in the chunk
  const urls = new Set();
  code.replace(/["'`](https?:\/\/[^"'`\s\\]{10,})["'`]/g, (_, u) => urls.add(u));
  console.log('\n=== All https URLs in chunk:');
  [...urls].forEach(u => console.log(' ', u));
  
  // Search for all API endpoint strings
  const endpoints = new Set();
  code.replace(/["'`](\/[a-z][a-z0-9/-]{3,}\?[^"'`\s\\]{3,})["'`]/g, (_, p) => endpoints.add(p));
  code.replace(/["'`](\/[a-z][a-z0-9/-]{3,})["'`]/g, (_, p) => {
    if (p.includes('latest') || p.includes('update') || p.includes('notice') || p.includes('announce') || p.includes('ticker') || p.includes('news')) endpoints.add(p);
  });
  console.log('\n=== Endpoint-like strings:');
  [...endpoints].forEach(e => console.log(' ', e));
  
  // Print 1500 chars around "latestUpdate" 
  const idx = code.indexOf('latestUpdate');
  if (idx >= 0) {
    console.log('\n=== 2000-char window around "latestUpdate":');
    console.log(code.substring(Math.max(0, idx - 500), idx + 1500));
  }
  
  // Also find "concat" calls that build URLs
  const concatMatches = [];
  code.replace(/\.concat\([\w.]+\s*,\s*["'`](\/[^"'`]+)["'`]/g, (_, p) => concatMatches.push(p));
  console.log('\n=== .concat() URL fragments:', concatMatches);
  
  // Search for Strapi API patterns
  console.log('\n=== Strapi-like API paths:');
  const strapi = [];
  code.replace(/["'`](\/[a-zA-Z][^"'`\s\\]*populate[^"'`\s\\]*)["'`]/g, (_, p) => strapi.push(p));
  strapi.forEach(s => console.log(' ', s));
}

main().catch(e => console.error('ERROR:', e.message));
