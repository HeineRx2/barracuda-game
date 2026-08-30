const html = require('fs').readFileSync('index.html', 'utf8');
const re = /id="([^"]+)"/g;
const ids = [];
let m;
while ((m = re.exec(html)) !== null) ids.push(m[1]);
const seen = {};
const dupes = [];
ids.forEach(id => {
  if (seen[id]) { if (!dupes.includes(id)) dupes.push(id); }
  else seen[id] = true;
});
console.log('Duplicate IDs:', dupes.join(', ') || 'none');
