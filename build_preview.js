const fs = require('fs');

let uiHtml = fs.readFileSync('ui.html', 'utf8');

// For preview.html in browser, make parent.postMessage safe and inject realistic sample data on click
const mockScript = `
    // Standalone browser preview mock
    if (typeof parent.postMessage !== 'function' || window === parent) {
      window.parent = {
        postMessage: (msgObj) => {
          console.log('Figma Plugin Message Sent:', msgObj);
          const type = msgObj.pluginMessage.type;
          if (type === 'close') {
            alert('Close button clicked');
          } else if (type === 'export-all' || type === 'export-design-system-docs') {
            // Load real exported data if available
            try {
              if (fs && fs.existsSync && fs.existsSync('design-system-full-export-figma.json')) {
                // browser environment doesn't have node fs directly, but we can embed sample
              }
            } catch(e) {}

            setTimeout(() => {
              window.postMessage({
                pluginMessage: {
                  type: 'export-result',
                  category: 'all',
                  data: {
                    pageName: '⛩ Design System (Overview)',
                    extractedSummary: {
                      componentsCount: 40,
                      totalVariantsCount: 1286,
                      variablesCount: 28,
                      stylesCount: 204
                    },
                    components: [
                      {
                        componentName: 'Alert',
                        theme: 'dark',
                        sections: [
                          {
                            variantType: 'Variant',
                            subVariants: [
                              { subVariantType: 'Standard', variantCount: 4 },
                              { subVariantType: 'Filled', variantCount: 4 },
                              { subVariantType: 'Outlined', variantCount: 4 }
                            ]
                          },
                          {
                            variantType: 'Cases',
                            subVariants: [
                              { subVariantType: 'Close', variantCount: 1 },
                              { subVariantType: 'Action', variantCount: 1 },
                              { subVariantType: 'Title', variantCount: 1 }
                            ]
                          }
                        ]
                      },
                      {
                        componentName: 'RadioButton',
                        theme: 'dark',
                        sections: [
                          {
                            variantType: 'Base',
                            subVariants: [
                              { subVariantType: 'Default', variantCount: 2 },
                              { subVariantType: 'Color', variantCount: 7 },
                              { subVariantType: 'States', variantCount: 6 },
                              { subVariantType: 'size', variantCount: 4 },
                              { subVariantType: 'Label', variantCount: 2 }
                            ]
                          }
                        ]
                      }
                    ],
                    variables: {
                      collections: [{ name: 'Theme Colors', modes: ['Light', 'Dark'] }],
                      variables: [{ name: 'primary/main', type: 'COLOR', valuesByMode: { Light: '#7B61FF', Dark: '#9333EA' } }]
                    },
                    styles: {
                      colors: { 'primary-500': { value: '#7B61FF', type: 'color' } },
                      typography: { 'Heading-1': { fontFamily: 'Inter', fontSize: 32 } }
                    }
                  }
                }
              }, '*');
            }, 500);
          } else if (type === 'export-tokens') {
            setTimeout(() => {
              window.postMessage({
                pluginMessage: {
                  type: 'export-result',
                  category: 'tokens',
                  data: {
                    variables: {
                      variables: new Array(28).fill({ name: 'token' })
                    },
                    styles: {
                      colors: new Array(136).fill({}),
                      typography: new Array(68).fill({})
                    }
                  }
                }
              }, '*');
            }, 300);
          }
        }
      };
    }
`;

uiHtml = uiHtml.replace('</script>', mockScript + '\n  </script>');
fs.writeFileSync('preview.html', uiHtml, 'utf8');
console.log('✅ Created standalone preview.html with all exporter features!');
