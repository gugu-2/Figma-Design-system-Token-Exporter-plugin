const fs = require('fs');

let raw = fs.readFileSync('file_overview.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

console.log('File Name:', data.name);
console.log('Total Pages:', data.document.children.length);

data.document.children.forEach((page, idx) => {
  console.log(`[${idx}] ID: ${page.id} | Page: "${page.name}" | Children: ${page.children ? page.children.length : 0}`);
});

