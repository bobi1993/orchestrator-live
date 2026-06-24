import https from 'https';
import fs from 'fs';

const auth = JSON.parse(fs.readFileSync('/Users/johndoe/Library/Application Support/com.vercel.cli/auth.json', 'utf8'));
const token = auth.token;
const OPENROUTER_KEY = 'sk-or-...36b1';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Update existing OPENROUTER_API_KEY
const envId = 'fbKxsD7rrpOmhlxm';
console.log('Updating OPENROUTER_API_KEY...');
const updated = await api('PATCH', `/v10/projects/prj_kygD7vdeVV2f0XwSVIqUGBtQYhAS/env/${envId}`, {
  value: OPENROUTER_KEY,
  target: ['production', 'preview'],
});
console.log('Result:', JSON.stringify(updated, null, 2));
