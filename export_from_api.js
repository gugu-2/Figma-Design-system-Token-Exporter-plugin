const fs = require('fs');
const https = require('https');
const path = require('path');

const FIGMA_TOKEN = 'figd_YOUR_TOKEN_HERE';
const FILE_KEY = 'fL8YGLfjPlERWUkTH8nw5f';

function fetchApiRaw(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.figma.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
        'User-Agent': 'FigmaDesignSystemExporter/1.0'
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchApi(endpoint, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    const res = await fetchApiRaw(endpoint);
    if (res.status === 429) {
      console.log(`⏳ Figma API rate limit hit. Waiting ${delay / 1000}s before retry (attempt ${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.round(delay * 1.5);
      continue;
    }
    return res;
  }
  throw new Error('Rate limit exceeded repeatedly');
}

function toHex(n) {
  return Math.round(n * 255).toString(16).padStart(2, '0');
}

function extractFills(fills) {
  if (!fills || !Array.isArray(fills)) return [];
  const results = [];
  for (const fill of fills) {
    if (fill.visible === false) continue;
    if (fill.type === 'SOLID' && fill.color) {
      const { r, g, b } = fill.color;
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      results.push({
        type: 'SOLID',
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(opacity * 100) / 100})`,
        opacity
      });
    } else {
      results.push({ type: fill.type, opacity: fill.opacity !== undefined ? fill.opacity : 1 });
    }
  }
  return results;
}

function extractStrokes(node) {
  if (!node.strokes || !Array.isArray(node.strokes)) return { strokes: [], strokeWeight: 0 };
  const strokesList = [];
  for (const s of node.strokes) {
    if (s.visible === false) continue;
    if (s.type === 'SOLID' && s.color) {
      const { r, g, b } = s.color;
      const opacity = s.opacity !== undefined ? s.opacity : 1;
      strokesList.push({
        type: 'SOLID',
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(opacity * 100) / 100})`,
        opacity
      });
    }
  }
  return {
    strokes: strokesList,
    strokeWeight: node.strokeWeight || 0,
    strokeAlign: node.strokeAlign || 'INSIDE'
  };
}

function extractEffects(node) {
  if (!node.effects || !Array.isArray(node.effects)) return [];
  const results = [];
  for (const eff of node.effects) {
    if (eff.visible === false) continue;
    if ((eff.type === 'DROP_SHADOW' || eff.type === 'INNER_SHADOW') && eff.color) {
      const { r, g, b, a } = eff.color;
      results.push({
        type: eff.type,
        color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(a * 100) / 100})`,
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        offset: eff.offset,
        radius: eff.radius,
        spread: eff.spread || 0
      });
    } else {
      results.push({ type: eff.type, radius: eff.radius });
    }
  }
  return results;
}

function extractTextLayers(node) {
  const textLayers = [];
  function walk(n) {
    if (n.type === 'TEXT') {
      const fills = extractFills(n.fills);
      const style = n.style || {};
      textLayers.push({
        name: n.name,
        keyword: n.characters,
        fontFamily: style.fontFamily || 'unknown',
        fontWeight: style.fontWeight || 400,
        fontSize: style.fontSize || 14,
        lineHeightPx: style.lineHeightPx || null,
        letterSpacing: style.letterSpacing || 0,
        color: fills.length > 0 ? (fills[0].hex || fills[0].rgba) : null
      });
    } else if (n.children) {
      n.children.forEach(walk);
    }
  }
  walk(node);
  return textLayers;
}

function extractInternalAutoLayouts(node) {
  const layouts = [];
  function walk(n) {
    if (n.children) {
      for (const child of n.children) {
        if (child.layoutMode && child.layoutMode !== 'NONE') {
          layouts.push({
            name: child.name,
            layoutMode: child.layoutMode,
            padding: {
              top: child.paddingTop || 0,
              right: child.paddingRight || 0,
              bottom: child.paddingBottom || 0,
              left: child.paddingLeft || 0
            },
            itemSpacing: child.itemSpacing || 0,
            primaryAxisAlignItems: child.primaryAxisAlignItems,
            counterAxisAlignItems: child.counterAxisAlignItems
          });
        }
        walk(child);
      }
    }
  }
  walk(node);
  return layouts;
}

function extractVariantSpecs(node) {
  const textLayers = extractTextLayers(node);
  const strokesData = extractStrokes(node);
  const fills = extractFills(node.fills);
  const effects = extractEffects(node);

  const bbox = node.absoluteBoundingBox || {};
  const width = bbox.width || node.size?.x || 0;
  const height = bbox.height || node.size?.y || 0;

  const specs = {
    id: node.id,
    name: node.name,
    type: node.type,
    isTextOnly: node.type === 'TEXT' || (textLayers.length > 0 && fills.length === 0 && strokesData.strokes.length === 0),
    dimensions: {
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100
    },
    fills,
    strokes: strokesData.strokes,
    strokeWeight: strokesData.strokeWeight,
    strokeAlign: strokesData.strokeAlign,
    cornerRadius: node.cornerRadius !== undefined ? node.cornerRadius : {
      topLeft: node.rectangleCornerRadii?.[0] || 0,
      topRight: node.rectangleCornerRadii?.[1] || 0,
      bottomRight: node.rectangleCornerRadii?.[2] || 0,
      bottomLeft: node.rectangleCornerRadii?.[3] || 0
    },
    effects,
    textKeywords: textLayers.map(t => t.keyword),
    textLayers
  };

  // Component root auto-layout (Type 2: Component Auto Layout)
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    specs.autoLayout = {
      layoutMode: node.layoutMode,
      padding: {
        top: node.paddingTop || 0,
        right: node.paddingRight || 0,
        bottom: node.paddingBottom || 0,
        left: node.paddingLeft || 0
      },
      itemSpacing: node.itemSpacing || 0,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems
    };
  }

  // Nested internal auto-layouts
  const internalLayouts = extractInternalAutoLayouts(node);
  if (internalLayouts.length > 0) {
    specs.internalAutoLayouts = internalLayouts;
  }

  // Component properties & references
  if (node.componentProperties) {
    specs.componentProperties = node.componentProperties;
  }

  return specs;
}

function getText(node) {
  if (node.type === 'TEXT') return node.characters;
  if (node.children) {
    for (const c of node.children) {
      const res = getText(c);
      if (res) return res;
    }
  }
  return '';
}

function parseFrameDoc(frameNode) {
  let headerTitle = frameNode.name;
  const sections = [];

  // 1. Find Header
  function findHeader(n) {
    if (n.name && n.name.includes('_docs/Header')) {
      const t = getText(n);
      if (t) headerTitle = t.trim();
      return;
    }
    if (n.children) n.children.forEach(findHeader);
  }
  findHeader(frameNode);

  // 2. Parse sections and rows
  let currentSection = { variantType: 'Main', subVariants: [] };
  sections.push(currentSection);

  function walkDoc(n) {
    if (n.name && n.name.includes('_docs/Title/Block')) {
      const t = getText(n);
      currentSection = { variantType: t || 'Section', subVariants: [] };
      sections.push(currentSection);
      return;
    }

    // Handle wrap frame that does NOT contain _docs/SmallTitle (e.g. Accordion, Breadcrumb)
    if (n.name === 'wrap' || n.name.startsWith('wrap')) {
      const hasSmallTitle = n.children && n.children.some(c => 
        c.name && (c.name.includes('_docs/SmallTitle/02') || c.name.includes('_docs/SmallTitle')) ||
        (c.children && c.children.some(c2 => c2.name && (c2.name.includes('_docs/SmallTitle/02') || c2.name.includes('_docs/SmallTitle'))))
      );

      if (!hasSmallTitle && n.children) {
        function unwrapDirect(cand) {
          if (cand.name && cand.name.startsWith('_docs')) return [];
          if (cand.type === 'INSTANCE' || cand.type === 'COMPONENT') return [cand];
          if (cand.type === 'FRAME' && cand.children) {
            const inner = [];
            cand.children.forEach(child => inner.push(...unwrapDirect(child)));
            return inner;
          }
          return [cand];
        }

        const directVariants = [];
        n.children.forEach(c => directVariants.push(...unwrapDirect(c)));

        if (directVariants.length > 0) {
          const extracted = directVariants.map(extractVariantSpecs);
          currentSection.subVariants.push({
            subVariantType: currentSection.variantType || 'Default',
            variantCount: extracted.length,
            variants: extracted
          });
          return;
        }
      }
    }

    if (n.children && n.children.some(c => c.name && (c.name.includes('_docs/SmallTitle/02') || c.name.includes('_docs/SmallTitle')))) {
      const smallTitleNode = n.children.find(c => c.name && (c.name.includes('_docs/SmallTitle/02') || c.name.includes('_docs/SmallTitle')));
      const subVariantType = getText(smallTitleNode).trim();

      function unwrapCandidates(cand) {
        if (cand.name && cand.name.startsWith('_docs')) return [];
        if (cand.type === 'INSTANCE' || cand.type === 'COMPONENT') return [cand];
        if (cand.type === 'FRAME' && cand.children) {
          const hasInnerComps = cand.children.some(c => c.type === 'INSTANCE' || c.type === 'COMPONENT' || (c.type === 'FRAME' && c.children));
          if (hasInnerComps) {
            const inner = [];
            cand.children.forEach(c => inner.push(...unwrapCandidates(c)));
            return inner;
          }
        }
        return [cand];
      }

      const variantNodes = [];
      n.children.forEach(c => {
        if (c.id !== smallTitleNode.id) {
          variantNodes.push(...unwrapCandidates(c));
        }
      });

      const extractedVariants = variantNodes.map(extractVariantSpecs);

      currentSection.subVariants.push({
        subVariantType: subVariantType || 'Default',
        variantCount: extractedVariants.length,
        variants: extractedVariants
      });
      return;
    }

    if (n.children) {
      n.children.forEach(walkDoc);
    }
  }

  walkDoc(frameNode);

  const cleanSections = sections.filter(s => s.subVariants.length > 0);

  return {
    componentName: headerTitle,
    frameId: frameNode.id,
    frameName: frameNode.name,
    sectionsCount: cleanSections.length,
    sections: cleanSections
  };
}

async function run() {
  const targetArg = process.argv[2] || 'Alert';
  const outDir = path.join(__dirname, 'exported_components');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log(`🚀 Starting extraction for: "${targetArg}"...`);

  // Load overview
  let overviewRaw = fs.readFileSync('file_overview.json', 'utf8').replace(/^\uFEFF/, '');
  const overview = JSON.parse(overviewRaw);
  const overviewPage = overview.document.children[0];

  const candidateFrames = overviewPage.children.filter(c => c.type === 'FRAME');

  let framesToExport = [];
  if (targetArg.toLowerCase() === 'all') {
    // Export all named frames that aren't dark duplicates or internal
    framesToExport = candidateFrames.filter(f => !f.name.startsWith('_docs') && !f.name.startsWith('[DARK]'));
  } else {
    const found = candidateFrames.find(f => f.name.toLowerCase() === targetArg.toLowerCase());
    if (found) {
      framesToExport.push(found);
    } else {
      console.error(`❌ Frame "${targetArg}" not found on Overview page.`);
      console.log('Available components:', candidateFrames.map(f => f.name).slice(0, 30).join(', '));
      return;
    }
  }

  console.log(`Found ${framesToExport.length} frame(s) to fetch and export.`);

  for (const frame of framesToExport) {
    console.log(`Fetching node ${frame.name} (id: ${frame.id})...`);
    try {
      const nodeData = await fetchApi(`/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(frame.id)}`);
      const doc = nodeData.nodes[frame.id]?.document;
      if (!doc) {
        console.warn(`Could not load doc for ${frame.name}`);
        continue;
      }
      const parsed = parseFrameDoc(doc);
      const safeName = frame.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = path.join(outDir, `${safeName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf8');

      console.log(`✅ Saved ${parsed.componentName} to ${filePath} (${parsed.sectionsCount} sections, ${parsed.sections.reduce((acc, s) => acc + s.subVariants.reduce((a2, sv) => a2 + sv.variantCount, 0), 0)} variants)`);
    } catch (err) {
      console.error(`Error processing ${frame.name}:`, err.message);
    }
  }

  console.log(`\n🎉 All done! Check the folder: ${outDir}`);
}

run();

