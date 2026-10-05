const fs = require('fs');

let raw = fs.readFileSync('alert_node.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);
const alertNode = data.nodes['1788:122645'].document;

function printDeep(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let extra = '';
  if (node.characters) extra += ` characters="${node.characters}"`;
  if (node.layoutMode) extra += ` layoutMode=${node.layoutMode}`;
  if (node.componentPropertyReferences) extra += ` compProps=${JSON.stringify(node.componentPropertyReferences)}`;

  console.log(`${indent}- [${node.type}] ${node.name} (${node.id})${extra}`);
  if (node.children) {
    node.children.forEach(c => printDeep(c, depth + 1));
  }
}

// Inspect the first wrap -> stack -> stack
const firstWrap = alertNode.children.find(c => c.name === 'wrap');
printDeep(firstWrap, 0);

