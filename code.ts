/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 480, height: 640 });

// Helper to safely sanitize any object for postMessage without Symbol/function crashes
function sanitize(val: any): any {
  if (val === undefined) return null;
  if (typeof val === 'symbol') return 'mixed';
  if (typeof val === 'function') return null;
  if (typeof val === 'bigint') return val.toString();
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(sanitize);
  const out: any = {};
  for (const k of Object.keys(val)) {
    out[k] = sanitize(val[k]);
  }
  return out;
}

// Convert 0-1 RGB value to 2-digit Hex
function toHex(n: number): string {
  return Math.round(n * 255).toString(16).padStart(2, '0');
}

// Extract solid & gradient colors safely with HEX and RGBA
function extractFills(nodeFills: any): any[] {
  if (!nodeFills || nodeFills === figma.mixed || !Array.isArray(nodeFills)) return [];
  const results: any[] = [];

  for (const fill of nodeFills) {
    if (!fill.visible) continue;
    if (fill.type === 'SOLID') {
      const { r, g, b } = fill.color;
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      results.push({
        type: 'SOLID',
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(opacity * 100) / 100})`,
        opacity
      });
    } else {
      results.push({
        type: fill.type,
        opacity: fill.opacity !== undefined ? fill.opacity : 1
      });
    }
  }
  return results;
}

// Extract strokes & borders
function extractStrokes(node: any): any {
  const nodeStrokes = node.strokes;
  if (!nodeStrokes || nodeStrokes === figma.mixed || !Array.isArray(nodeStrokes)) {
    return { strokes: [], strokeWeight: 0, strokeAlign: 'CENTER' };
  }
  const strokesList: any[] = [];

  for (const s of nodeStrokes) {
    if (!s.visible) continue;
    if (s.type === 'SOLID') {
      const { r, g, b } = s.color;
      const opacity = s.opacity !== undefined ? s.opacity : 1;
      strokesList.push({
        type: 'SOLID',
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(opacity * 100) / 100})`,
        opacity
      });
    } else {
      strokesList.push({ type: s.type });
    }
  }

  let sw = 0;
  if (typeof node.strokeWeight === 'number') {
    sw = node.strokeWeight;
  } else if (typeof node.strokeWeight === 'symbol') {
    sw = 'mixed' as any;
  }

  return {
    strokes: strokesList,
    strokeWeight: sw,
    strokeAlign: node.strokeAlign || 'INSIDE'
  };
}

// Extract corner radius (handles mixed corners gracefully)
function extractCornerRadius(node: any): any {
  if (node.cornerRadius === undefined) return 0;
  if (typeof node.cornerRadius === 'number') return node.cornerRadius;
  if (typeof node.cornerRadius === 'symbol') {
    return {
      topLeft: node.topLeftRadius || 0,
      topRight: node.topRightRadius || 0,
      bottomRight: node.bottomRightRadius || 0,
      bottomLeft: node.bottomLeftRadius || 0
    };
  }
  return node.cornerRadius;
}

// Extract effects (drop shadows, inner shadows, blurs)
function extractEffects(node: any): any[] {
  if (!node.effects || !Array.isArray(node.effects)) return [];
  const results: any[] = [];

  for (const eff of node.effects) {
    if (!eff.visible) continue;
    if (eff.type === 'DROP_SHADOW' || eff.type === 'INNER_SHADOW') {
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
      results.push({
        type: eff.type,
        radius: 'radius' in eff ? (eff as any).radius : undefined
      });
    }
  }
  return results;
}

// Extract all text layers nested inside a node
function extractTextLayers(node: SceneNode): any[] {
  const textLayers: any[] = [];
  function walkText(n: SceneNode) {
    if (n.type === 'TEXT') {
      const fills = extractFills(n.fills);
      let ls = 'normal';
      if (typeof n.letterSpacing === 'object' && n.letterSpacing !== null && typeof (n.letterSpacing as any).value === 'number') {
        ls = (n.letterSpacing as any).unit === 'PERCENT' ? `${(n.letterSpacing as any).value}%` : `${(n.letterSpacing as any).value}px`;
      }
      let lh = 'auto';
      if (typeof n.lineHeight === 'object' && n.lineHeight !== null && typeof (n.lineHeight as any).value === 'number') {
        lh = (n.lineHeight as any).unit === 'PERCENT' ? `${(n.lineHeight as any).value}%` : `${(n.lineHeight as any).value}px`;
      }

      textLayers.push({
        name: n.name,
        keyword: n.characters,
        characters: n.characters,
        fontFamily: typeof n.fontName === 'object' && n.fontName !== null ? (n.fontName as any).family : 'unknown',
        fontWeight: typeof n.fontName === 'object' && n.fontName !== null ? (n.fontName as any).style : 'regular',
        fontSize: typeof n.fontSize === 'number' ? n.fontSize : 'mixed',
        lineHeight: lh,
        letterSpacing: ls,
        color: fills.length > 0 ? (fills[0].hex || fills[0].rgba) : null
      });
    } else if ('children' in n) {
      for (const child of (n as any).children) {
        walkText(child);
      }
    }
  }
  walkText(node);
  return textLayers;
}

// Get text content of a node (or search for child text with specific name)
function getTextFromNode(node: SceneNode, targetName?: string): string | null {
  if (node.type === 'TEXT') {
    if (!targetName || node.name.toLowerCase() === targetName.toLowerCase()) {
      return node.characters;
    }
  }
  if ('children' in node) {
    if (targetName) {
      for (const child of (node as any).children) {
        if (child.type === 'TEXT' && child.name.toLowerCase() === targetName.toLowerCase()) {
          return child.characters;
        }
      }
    }
    for (const child of (node as any).children) {
      const res = getTextFromNode(child, targetName);
      if (res) return res;
    }
  }
  return null;
}

// Check doc naming conventions
function isDocHeader(node: SceneNode): boolean {
  return node.name.includes('_docs/Header');
}

function isSectionTitle(node: SceneNode): boolean {
  return node.name.includes('_docs/Title/Block');
}

function isSubVariantTitle(node: SceneNode): boolean {
  return node.name.includes('_docs/SmallTitle/02') || node.name.includes('_docs/SmallTitle');
}

function isAnyDocComponent(node: SceneNode): boolean {
  return node.name.startsWith('_docs') || node.name.includes('_docs/');
}

// Extract full design specifications of a variant node
function extractVariantDesignSpecs(node: SceneNode, theme: 'light' | 'dark' = 'light'): any {
  const isTextOnly = node.type === 'TEXT';
  const textLayers = extractTextLayers(node);
  const strokesData = extractStrokes(node);
  const fills = 'fills' in node ? extractFills((node as any).fills) : [];
  const effects = 'effects' in node ? extractEffects(node) : [];
  const cornerRadius = extractCornerRadius(node);

  const specs: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    theme: theme,
    isTextOnly: isTextOnly || (textLayers.length > 0 && fills.length === 0 && strokesData.strokes.length === 0),
    dimensions: {
      width: Math.round(node.width * 100) / 100,
      height: Math.round(node.height * 100) / 100
    },
    position: {
      x: Math.round(node.x * 100) / 100,
      y: Math.round(node.y * 100) / 100
    },
    fills,
    strokes: strokesData.strokes,
    strokeWeight: strokesData.strokeWeight,
    strokeAlign: strokesData.strokeAlign,
    cornerRadius,
    effects,
    textKeywords: textLayers.map(t => t.keyword),
    textLayers
  };

  // Root auto-layout specs (Type 2: Component Auto Layout)
  if ('layoutMode' in node && (node as any).layoutMode !== 'NONE') {
    const fn = node as any;
    specs.autoLayout = {
      layoutMode: fn.layoutMode,
      primaryAxisSizingMode: fn.primaryAxisSizingMode,
      counterAxisSizingMode: fn.counterAxisSizingMode,
      primaryAxisAlignItems: fn.primaryAxisAlignItems,
      counterAxisAlignItems: fn.counterAxisAlignItems,
      padding: {
        top: fn.paddingTop,
        right: fn.paddingRight,
        bottom: fn.paddingBottom,
        left: fn.paddingLeft
      },
      itemSpacing: fn.itemSpacing
    };
  }

  // Nested internal auto-layouts inside this variant
  const internalLayouts: any[] = [];
  function walkInternal(n: SceneNode) {
    if ('children' in n) {
      for (const child of (n as any).children) {
        if ('layoutMode' in child && (child as any).layoutMode !== 'NONE') {
          internalLayouts.push({
            name: child.name,
            layoutMode: (child as any).layoutMode,
            padding: {
              top: (child as any).paddingTop,
              right: (child as any).paddingRight,
              bottom: (child as any).paddingBottom,
              left: (child as any).paddingLeft
            },
            itemSpacing: (child as any).itemSpacing,
            primaryAxisAlignItems: (child as any).primaryAxisAlignItems,
            counterAxisAlignItems: (child as any).counterAxisAlignItems
          });
        }
        walkInternal(child);
      }
    }
  }
  walkInternal(node);
  if (internalLayouts.length > 0) {
    specs.internalAutoLayouts = internalLayouts;
  }

  // Component properties (booleans, text, instance swap)
  if ('componentProperties' in node && (node as any).componentProperties) {
    specs.componentProperties = {};
    const props = (node as any).componentProperties;
    for (const k of Object.keys(props)) {
      specs.componentProperties[k] = {
        type: props[k].type,
        value: props[k].value
      };
    }
  }

  // Variant properties (e.g. Variant=Filled, Severity=Success)
  if ('variantProperties' in node && (node as any).variantProperties) {
    specs.variantProperties = (node as any).variantProperties;
  }

  // Main component reference if instance
  if (node.type === 'INSTANCE') {
    const mainComp = (node as InstanceNode).mainComponent;
    if (mainComp) {
      specs.mainComponent = {
        name: mainComp.name,
        parentSet: mainComp.parent && mainComp.parent.type === 'COMPONENT_SET' ? mainComp.parent.name : null
      };
    }
  }

  return specs;
}

// Find header title from _docs/Header
function findHeaderTitle(root: SceneNode): string {
  let headerNode: SceneNode | null = null;
  function searchHeader(n: SceneNode) {
    if (isDocHeader(n)) {
      headerNode = n;
      return;
    }
    if ('children' in n) {
      for (const c of (n as any).children) {
        if (!headerNode) searchHeader(c);
      }
    }
  }
  searchHeader(root);

  if (headerNode) {
    const titleText = getTextFromNode(headerNode, 'title') || getTextFromNode(headerNode);
    if (titleText && titleText.trim().length > 0) {
      return titleText.trim();
    }
  }

  // Clean name without [DARK] prefix
  return root.name.replace(/^\[DARK\]\s*/i, '').trim();
}

// Parse a single Documentation Frame according to user's guidelines
function parseDocFrame(frame: SceneNode): any {
  const isDark = frame.name.startsWith('[DARK]');
  const theme: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const componentName = findHeaderTitle(frame);

  // 1. Collect all Section headers (_docs/Title/Block)
  const sectionNodes: { node: SceneNode; title: string; y: number }[] = [];
  // 2. Collect all Sub-variant headers (_docs/SmallTitle/02)
  const subVariantNodes: { node: SceneNode; title: string; y: number }[] = [];

  function collectDocHeaders(n: SceneNode) {
    if (isSectionTitle(n)) {
      const text = getTextFromNode(n) || 'Variant';
      sectionNodes.push({ node: n, title: text.trim(), y: n.absoluteTransform[1][2] });
    } else if (isSubVariantTitle(n)) {
      const text = getTextFromNode(n) || 'SubVariant';
      subVariantNodes.push({ node: n, title: text.trim(), y: n.absoluteTransform[1][2] });
    }

    if ('children' in n && !isSectionTitle(n) && !isSubVariantTitle(n)) {
      for (const child of (n as any).children) {
        collectDocHeaders(child);
      }
    }
  }

  collectDocHeaders(frame);

  // Sort sections and sub-variants vertically
  sectionNodes.sort((a, b) => a.y - b.y);
  subVariantNodes.sort((a, b) => a.y - b.y);

  // If no sections found, create a default "Main" section
  if (sectionNodes.length === 0) {
    sectionNodes.push({
      node: frame,
      title: 'Main',
      y: -Infinity
    });
  }

  // Prepare section groups
  const sectionsMap: { [key: string]: { variantType: string; subVariants: any[] } } = {};
  for (const s of sectionNodes) {
    sectionsMap[s.title] = {
      variantType: s.title,
      subVariants: []
    };
  }

  const processedVariantIds = new Set<string>();

  // Helper to unwrap wrapper frames (ignoring Type 1 doc auto layout)
  function unwrapCandidate(candidate: SceneNode): SceneNode[] {
    if (isAnyDocComponent(candidate)) return [];
    if (candidate.type === 'COMPONENT' || candidate.type === 'INSTANCE' || candidate.type === 'COMPONENT_SET') {
      return [candidate];
    }
    if ('children' in candidate && candidate.type === 'FRAME') {
      const hasComponents = (candidate as any).children.some((c: SceneNode) => 
        c.type === 'COMPONENT' || c.type === 'INSTANCE' || c.type === 'COMPONENT_SET' || ('children' in c && c.type === 'FRAME')
      );
      if (hasComponents) {
        const inner: SceneNode[] = [];
        for (const child of (candidate as any).children) {
          inner.push(...unwrapCandidate(child));
        }
        return inner;
      }
    }
    return [candidate];
  }

  // For each sub-variant title, find its sibling/row variants
  for (const sv of subVariantNodes) {
    let matchedSection = sectionNodes[0];
    for (const sec of sectionNodes) {
      if (sec.y <= sv.y) {
        matchedSection = sec;
      } else {
        break;
      }
    }

    const rawCandidates: SceneNode[] = [];
    const parent = sv.node.parent;
    if (parent && 'children' in parent) {
      for (const sibling of (parent as any).children) {
        if (sibling.id !== sv.node.id && !isAnyDocComponent(sibling)) {
          rawCandidates.push(sibling);
        }
      }
    }

    if (rawCandidates.length === 0 && parent && parent.parent && 'children' in parent.parent) {
      for (const cousin of (parent.parent as any).children) {
        if (cousin.id !== parent.id && !isAnyDocComponent(cousin)) {
          rawCandidates.push(cousin);
        }
      }
    }

    const variantsInRow: SceneNode[] = [];
    for (const cand of rawCandidates) {
      variantsInRow.push(...unwrapCandidate(cand));
    }

    const extractedRowVariants: any[] = [];
    for (const vNode of variantsInRow) {
      if (!processedVariantIds.has(vNode.id)) {
        processedVariantIds.add(vNode.id);
        extractedRowVariants.push(extractVariantDesignSpecs(vNode, theme));
      }
    }

    sectionsMap[matchedSection.title].subVariants.push({
      subVariantType: sv.title,
      variantCount: extractedRowVariants.length,
      variants: extractedRowVariants
    });
  }

  // Fallback for components like Accordion and Breadcrumb where variants are placed directly in wrap without _docs/SmallTitle
  for (const s of sectionNodes) {
    if (sectionsMap[s.title].subVariants.length === 0) {
      const directVariants: SceneNode[] = [];
      function findDirect(n: SceneNode) {
        if (isAnyDocComponent(n)) return;
        if (n.type === 'INSTANCE' || n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') {
          directVariants.push(n);
          return;
        }
        if ('children' in n && n.type === 'FRAME') {
          for (const child of (n as any).children) {
            findDirect(child);
          }
        }
      }
      findDirect(s.node);

      const extracted = directVariants.filter(v => !processedVariantIds.has(v.id)).map(v => {
        processedVariantIds.add(v.id);
        return extractVariantDesignSpecs(v, theme);
      });

      if (extracted.length > 0) {
        sectionsMap[s.title].subVariants.push({
          subVariantType: s.title || 'Default',
          variantCount: extracted.length,
          variants: extracted
        });
      }
    }
  }

  // Convert map to array
  const sectionsArray = Object.values(sectionsMap).filter(s => s.subVariants.length > 0);

  return {
    componentName,
    theme,
    frameId: frame.id,
    frameName: frame.name,
    sectionsCount: sectionsArray.length,
    sections: sectionsArray
  };
}

// Main message router
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'export-design-system-docs' || msg.type === 'export-all') {
      let targetFrames: SceneNode[] = [];

      // If user selected specific frames, process those
      if (figma.currentPage.selection.length > 0) {
        targetFrames = [...figma.currentPage.selection];
      } else {
        // Otherwise grab all component frames on the page (ignoring doc layout banners)
        targetFrames = figma.currentPage.children.filter(c => 
          (c.type === 'FRAME' || c.type === 'SECTION') && 
          !c.name.startsWith('_docs') && 
          !c.name.startsWith('[LAYOUT]') &&
          !c.name.startsWith('[MOBILE]')
        );
      }

      const docComponents = targetFrames
        .map(f => parseDocFrame(f))
        .filter(c => c.sectionsCount > 0);

      const styles = exportStyles();
      const variables = await exportVariables();

      const totalVariants = docComponents.reduce((acc, c) => 
        acc + c.sections.reduce((a2: number, s: any) => 
          a2 + s.subVariants.reduce((a3: number, sv: any) => a3 + (sv.variantCount || 0), 0), 0), 0
      );

      const payload = sanitize({
        pageName: figma.currentPage.name,
        extractedSummary: {
          componentsCount: docComponents.length,
          totalVariantsCount: totalVariants,
          variablesCount: variables.variables ? variables.variables.length : 0,
          stylesCount: Object.keys(styles.colors).length + Object.keys(styles.typography).length
        },
        components: docComponents,
        variables,
        styles
      });

      figma.ui.postMessage({ type: 'export-result', category: 'all', data: payload });

    } else if (msg.type === 'export-tokens') {
      const styles = exportStyles();
      const variables = await exportVariables();
      const payload = sanitize({ styles, variables });
      figma.ui.postMessage({ type: 'export-result', category: 'tokens', data: payload });
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (error: any) {
    const errorMsg = error && error.message ? error.message : String(error);
    figma.ui.postMessage({ type: 'export-error', error: errorMsg });
  }
};

// Supporting styles & variables exports
async function exportVariables() {
  const result: any = { collections: [], variables: [] };
  try {
    if ('variables' in figma && typeof figma.variables.getLocalVariableCollectionsAsync === 'function') {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      result.collections = collections.map(col => ({
        id: col.id,
        name: col.name,
        defaultModeId: col.defaultModeId,
        modes: col.modes
      }));

      const variables = await figma.variables.getLocalVariablesAsync();

      result.variables = variables.map(v => {
        const modeValues: any = {};
        for (const modeId of Object.keys(v.valuesByMode)) {
          const val = v.valuesByMode[modeId];
          if (v.resolvedType === 'COLOR' && typeof val === 'object' && val !== null && 'r' in val) {
            const { r, g, b, a = 1 } = val as RGBA;
            modeValues[modeId] = {
              hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
              rgba: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
              raw: val
            };
          } else {
            modeValues[modeId] = val;
          }
        }
        return {
          id: v.id,
          name: v.name,
          description: v.description,
          type: v.resolvedType,
          valuesByMode: modeValues
        };
      });
    }
  } catch (err) {
    result.error = String(err);
  }
  return result;
}

function exportStyles() {
  const tokens: any = { colors: {}, typography: {}, effects: {}, grids: {} };
  try {
    const paintStyles = figma.getLocalPaintStyles();

    paintStyles.forEach(style => {
      const solidPaint = style.paints.find(p => p.type === 'SOLID') as SolidPaint | undefined;
      if (solidPaint) {
        const { r, g, b } = solidPaint.color;
        const a = solidPaint.opacity !== undefined ? solidPaint.opacity : 1;
        tokens.colors[style.name] = {
          value: a === 1 ? `#${toHex(r)}${toHex(g)}${toHex(b)}` : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(a * 100) / 100})`,
          type: 'color',
          description: style.description
        };
      }
    });

    const textStyles = figma.getLocalTextStyles();
    textStyles.forEach(style => {
      tokens.typography[style.name] = {
        fontFamily: style.fontName ? style.fontName.family : 'unknown',
        fontWeight: style.fontName ? style.fontName.style : 'regular',
        fontSize: typeof style.fontSize === 'number' ? style.fontSize : 'mixed',
        letterSpacing: typeof style.letterSpacing === 'object' && style.letterSpacing !== null
          ? (style.letterSpacing.unit === 'PERCENT' ? `${style.letterSpacing.value}%` : `${style.letterSpacing.value}px`) : 'normal',
        lineHeight: typeof style.lineHeight === 'object' && style.lineHeight !== null
          ? (style.lineHeight.unit === 'AUTO' ? 'auto' : `${style.lineHeight.value}${style.lineHeight.unit === 'PERCENT' ? '%' : 'px'}`) : 'auto',
        description: style.description
      };
    });

    const effectStyles = figma.getLocalEffectStyles();
    effectStyles.forEach(style => {
      tokens.effects[style.name] = {
        description: style.description,
        effects: style.effects.map(effect => {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            const { r, g, b, a } = effect.color;
            return {
              type: effect.type,
              color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(a * 100) / 100})`,
              offset: effect.offset,
              radius: effect.radius,
              spread: effect.spread,
              visible: effect.visible
            };
          } else {
            return {
              type: effect.type,
              radius: 'radius' in effect ? (effect as any).radius : undefined,
              visible: effect.visible
            };
          }
        })
      };
    });
  } catch (err) {
    tokens.error = String(err);
  }
  return tokens;
}
