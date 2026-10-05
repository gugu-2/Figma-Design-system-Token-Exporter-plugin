const fs = require('fs');

let raw = fs.readFileSync('file_overview.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);
const page = data.document.children[0];

console.log('Page Name:', page.name, '| Total Children:', page.children.length);

page.children.forEach((c, idx) => {
  console.log(`[${idx}] ID: ${c.id} | Name: ${JSON.stringify(c.name)} | Type: ${c.type}`);
});

