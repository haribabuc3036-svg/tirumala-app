const https = require('https');
const axios = require('axios');
const agent = new https.Agent({ rejectUnauthorized: false });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const ax = axios.create({ httpsAgent: agent, timeout: 15000, headers: { 'User-Agent': UA } });

ax.get('https://services.tirupatibalaji.ap.gov.in/universal-latest-updates?populate=*')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Response (3000):', JSON.stringify(r.data).substring(0, 3000));
  })
  .catch(e => {
    console.error('Error:', e.response?.status, e.message);
  });
