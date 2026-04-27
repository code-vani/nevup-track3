const fs = require('fs');
const raw = fs.readFileSync('./seed/nevup_seed_dataset.csv', 'utf-8');
const lines = raw.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());
const rows = lines.slice(1).map(line => {
  const vals = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  vals.push(cur.trim());
  const obj = {};
  headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
  return obj;
});
fs.writeFileSync('./seed/data.json', JSON.stringify(rows, null, 2));
console.log('Done! Rows:', rows.length);