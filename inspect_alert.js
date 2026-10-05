const fs = require('fs');

let raw = fs.readFileSync('alert_node.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

const alertNode = data.nodes['1788:122645'].document;
console.log('Root Node:', alertNode.name, '| Type:', alertNode.type);
console.log('Root Children:', alertNode.children.map(c => `${c.name} (${c.type})`));

function inspectChildren(node, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}- [${node.type}] ${node.name} (id: ${node.id})`);
  if (node.children && depth < 3) {
    node.children.forEach(c => inspectChildren(c, depth + 1));
  }
}

inspectChildren(alertNode, 0);

