const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'client');
const needle = '<meta name="author" content="El Taller Distribuidora">';
const insert = `${needle}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="El Taller Distribuidora">
  <meta property="og:image" content="https://eltallerdistribuidora.com/eltaller.png">
  <meta name="twitter:card" content="summary_large_image">`;

let n = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.html')) continue;
  const full = path.join(dir, file);
  let html = fs.readFileSync(full, 'utf8');
  if (html.includes('og:site_name')) continue;
  if (!html.includes(needle)) {
    console.log('skip', file);
    continue;
  }
  html = html.replace(needle, insert);
  fs.writeFileSync(full, html, 'utf8');
  n++;
  console.log('ok', file);
}
console.log('done', n);
