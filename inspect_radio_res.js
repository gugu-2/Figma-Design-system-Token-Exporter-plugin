const fs = require('fs');
const data = JSON.parse(fs.readFileSync('exported_components/RadioButton.json', 'utf8'));

console.log('Component Name:', data.componentName);
data.sections.forEach(s => {
  console.log(`Section: "${s.variantType}"`);
  s.subVariants.forEach(sv => {
    console.log(` - Row [${sv.subVariantType}]: ${sv.variantCount} variants`);
    sv.variants.forEach((v, i) => {
      console.log(`     (${i+1}) ${v.name} | Size: ${v.dimensions.width}x${v.dimensions.height} | Colors: ${v.fills.map(f => f.hex).join(', ')}`);
    });
  });
});

