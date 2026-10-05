const fs = require('fs');

const bgDataUri = fs.readFileSync('assets/bg_base64.txt', 'utf8').trim();

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Design System Studio</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Inter, sans-serif;
      user-select: none;
    }

    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #180838 url('${bgDataUri}') no-repeat center center;
      background-size: cover;
      color: #FFFFFF;
      position: relative;
    }

    /* Ambient cosmic aura */
    .cosmic-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 50% 0%, rgba(216, 180, 254, 0.18), transparent 60%);
      z-index: 1;
    }

    /* Top Bar */
    .header {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.16);
      background: rgba(24, 8, 56, 0.3);
      backdrop-filter: blur(12px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sparkle-icon {
      width: 22px;
      height: 22px;
      fill: #FFFFFF;
      filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 14px rgba(192, 132, 252, 0.8));
      animation: pulseSparkle 3s ease-in-out infinite alternate;
    }

    @keyframes pulseSparkle {
      0% { transform: scale(0.95); opacity: 0.85; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.7)); }
      100% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(216, 180, 254, 0.9)); }
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #FFFFFF;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    .subtitle {
      font-size: 10px;
      color: rgba(233, 213, 255, 0.75);
      letter-spacing: 0.2px;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.15);
      transform: rotate(90deg);
    }

    /* Main Container */
    .main-content {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 14px 18px 16px;
      gap: 12px;
      overflow-y: auto;
    }

    /* Search & Filter Pill */
    .search-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(139, 92, 246, 0.32);
      border: 1px solid rgba(216, 180, 254, 0.32);
      backdrop-filter: blur(14px);
      box-shadow: 0 4px 16px rgba(33, 10, 77, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      padding: 8px 16px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .search-pill:focus-within {
      background: rgba(139, 92, 246, 0.5);
      border-color: rgba(233, 213, 255, 0.75);
      box-shadow: 0 0 18px rgba(192, 132, 252, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35);
      transform: translateY(-1px);
    }

    .search-icon {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: #E9D5FF;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0.9;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.1px;
    }

    .search-input::placeholder {
      color: rgba(233, 213, 255, 0.65);
      font-weight: 400;
    }

    /* Primary Action Buttons */
    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-glow-primary {
      padding: 12px 18px;
      background: linear-gradient(135deg, #9333EA 0%, #7E22CE 50%, #6B21A8 100%);
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid rgba(233, 213, 255, 0.4);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(147, 51, 234, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3);
      transition: all 0.22s;
    }

    .btn-glow-primary:hover {
      background: linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #7E22CE 100%);
      box-shadow: 0 6px 24px rgba(168, 85, 247, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    .btn-glow-primary:active {
      transform: translateY(1px);
    }

    .button-sub-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .btn-glass {
      padding: 9px 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #E9D5FF;
      font-size: 12px;
      font-weight: 500;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }

    .btn-glass:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #FFFFFF;
      border-color: rgba(216, 180, 254, 0.4);
    }

    /* 2x2 Metric Cards Grid (Vibe from reference) */
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .metric-card {
      position: relative;
      background: rgba(76, 29, 149, 0.32);
      border: 1px solid rgba(192, 132, 252, 0.22);
      border-radius: 14px;
      backdrop-filter: blur(14px);
      box-shadow: 0 4px 16px rgba(24, 8, 56, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(233, 213, 255, 0.55);
      background: rgba(109, 40, 217, 0.45);
      box-shadow: 0 8px 22px rgba(126, 34, 206, 0.4), 0 0 14px rgba(192, 132, 252, 0.35);
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .metric-icon {
      font-size: 16px;
      filter: drop-shadow(0 0 6px rgba(216, 180, 254, 0.6));
    }

    .metric-title {
      font-size: 11px;
      font-weight: 600;
      color: rgba(233, 213, 255, 0.85);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #FFFFFF;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      margin-top: 2px;
    }

    .metric-sub {
      font-size: 9.5px;
      color: rgba(233, 213, 255, 0.65);
    }

    /* Status Bar */
    .status-badge {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 11.5px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }

    .status-badge.info {
      display: flex;
      background: rgba(59, 130, 246, 0.25);
      border: 1px solid rgba(147, 197, 253, 0.4);
      color: #DBEAFE;
    }

    .status-badge.success {
      display: flex;
      background: rgba(34, 197, 94, 0.25);
      border: 1px solid rgba(134, 239, 172, 0.4);
      color: #DCFCE7;
    }

    .status-badge.error {
      display: flex;
      background: rgba(239, 68, 68, 0.25);
      border: 1px solid rgba(252, 165, 165, 0.4);
      color: #FEE2E2;
    }

    /* JSON Output Area */
    .output-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      min-height: 140px;
      gap: 6px;
    }

    .output-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2px;
    }

    .output-title {
      font-size: 11px;
      font-weight: 600;
      color: rgba(233, 213, 255, 0.85);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .output-badge {
      font-size: 9.5px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: #E9D5FF;
    }

    textarea {
      flex: 1;
      width: 100%;
      background: rgba(24, 8, 56, 0.65);
      border: 1px solid rgba(216, 180, 254, 0.25);
      border-radius: 12px;
      padding: 10px 12px;
      color: #F3E8FF;
      font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
      font-size: 11px;
      line-height: 1.45;
      resize: none;
      outline: none;
      backdrop-filter: blur(12px);
    }

    textarea:focus {
      border-color: rgba(233, 213, 255, 0.6);
      box-shadow: 0 0 14px rgba(192, 132, 252, 0.35);
    }

    /* Footer Buttons */
    .footer-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      position: relative;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div class="cosmic-overlay"></div>

  <!-- Header -->
  <header class="header">
    <div class="brand">
      <svg class="sparkle-icon" viewBox="0 0 24 24">
        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/>
      </svg>
      <div class="brand-text">
        <h1 class="title">Design System Studio</h1>
        <span class="subtitle">Cosmic Token &amp; Component Exporter</span>
      </div>
    </div>
    <button id="btn-close" class="close-btn" title="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Search / Filter Pill -->
    <div class="search-pill">
      <svg class="search-icon" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="search-input" class="search-input" placeholder="Search components, variables, tokens...">
    </div>

    <!-- Primary Action Buttons -->
    <div class="actions-section">
      <button id="btn-export-all" class="btn-glow-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        ⚡ Extract EVERYTHING on this Page
      </button>

      <div class="button-sub-grid">
        <button id="btn-export-selection" class="btn-glass">
          🎯 Extract Selection Only
        </button>
        <button id="btn-export-tokens" class="btn-glass">
          🎨 Variables &amp; Tokens
        </button>
      </div>
    </div>

    <!-- Status Banner -->
    <div id="status-bar" class="status-badge">
      <span id="status-text">Ready to export</span>
    </div>

    <!-- 2x2 Metric Cards (Innovated from Reference) -->
    <div class="metric-grid" id="metric-grid">
      <div class="metric-card" id="card-components">
        <div class="metric-header">
          <span class="metric-title">Components</span>
          <span class="metric-icon">🧩</span>
        </div>
        <span class="metric-value" id="val-components">40</span>
        <span class="metric-sub" id="sub-components">Light &amp; Dark paired</span>
      </div>

      <div class="metric-card" id="card-variants">
        <div class="metric-header">
          <span class="metric-title">Variants</span>
          <span class="metric-icon">⚡</span>
        </div>
        <span class="metric-value" id="val-variants">1,286</span>
        <span class="metric-sub" id="sub-variants">Auto-layout &amp; coords</span>
      </div>

      <div class="metric-card" id="card-variables">
        <div class="metric-header">
          <span class="metric-title">Variables</span>
          <span class="metric-icon">🔮</span>
        </div>
        <span class="metric-value" id="val-variables">28</span>
        <span class="metric-sub" id="sub-variables">Collections &amp; modes</span>
      </div>

      <div class="metric-card" id="card-styles">
        <div class="metric-header">
          <span class="metric-title">Styles</span>
          <span class="metric-icon">🎨</span>
        </div>
        <span class="metric-value" id="val-styles">204</span>
        <span class="metric-sub" id="sub-styles">Color, type &amp; shadow</span>
      </div>
    </div>

    <!-- Output JSON Preview Area -->
    <div class="output-section">
      <div class="output-header">
        <span class="output-title">Exported JSON Data</span>
        <span class="output-badge" id="output-badge">Ready</span>
      </div>
      <textarea id="output" placeholder="Click 'Extract EVERYTHING' or 'Extract Selection' to see clean design system JSON data here..." readonly></textarea>
    </div>

    <!-- Footer Action Buttons -->
    <div class="footer-actions">
      <button id="btn-copy" class="btn-glass">📋 Copy JSON</button>
      <button id="btn-download" class="btn-glass">💾 Download All (.json)</button>
    </div>
  </main>

  <script>
    const statusBar = document.getElementById('status-bar');
    const statusText = document.getElementById('status-text');
    const output = document.getElementById('output');
    const outputBadge = document.getElementById('output-badge');
    const searchInput = document.getElementById('search-input');
    const copyBtn = document.getElementById('btn-copy');
    const downloadBtn = document.getElementById('btn-download');
    const closeBtn = document.getElementById('btn-close');

    const valComponents = document.getElementById('val-components');
    const valVariants = document.getElementById('val-variants');
    const valVariables = document.getElementById('val-variables');
    const valStyles = document.getElementById('val-styles');

    let currentExportData = null;

    function setStatus(text, type = 'info') {
      statusBar.style.display = 'flex';
      statusBar.className = 'status-badge ' + type;
      statusText.textContent = text;
    }

    // Close button
    closeBtn.onclick = () => {
      parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
    };

    // Primary action: Extract All
    document.getElementById('btn-export-all').onclick = () => {
      setStatus('⏳ Scanning entire page (Components, Variants, Variables & Styles)...', 'info');
      outputBadge.textContent = 'Extracting...';
      parent.postMessage({ pluginMessage: { type: 'export-all' } }, '*');
    };

    // Secondary action: Extract Selection Only
    document.getElementById('btn-export-selection').onclick = () => {
      setStatus('⏳ Analyzing selected component frame...', 'info');
      outputBadge.textContent = 'Analyzing Selection...';
      parent.postMessage({ pluginMessage: { type: 'export-design-system-docs' } }, '*');
    };

    // Secondary action: Extract Tokens Only
    document.getElementById('btn-export-tokens').onclick = () => {
      setStatus('⏳ Extracting Figma Variables & Styles...', 'info');
      outputBadge.textContent = 'Extracting Tokens...';
      parent.postMessage({ pluginMessage: { type: 'export-tokens' } }, '*');
    };

    // Copy JSON to clipboard
    copyBtn.onclick = () => {
      if (!output.value) {
        setStatus('Please extract data first!', 'error');
        return;
      }
      output.select();
      document.execCommand('copy');
      const prev = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyBtn.textContent = prev; }, 1800);
    };

    // Download JSON file
    downloadBtn.onclick = () => {
      if (!output.value) {
        setStatus('Please extract data first!', 'error');
        return;
      }
      const blob = new Blob([output.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'design-system-full-export.json';
      a.click();
      URL.revokeObjectURL(url);
    };

    // Real-time search filter in output
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!currentExportData) return;

      if (!q) {
        output.value = JSON.stringify(currentExportData, null, 2);
        outputBadge.textContent = 'Full Export';
        return;
      }

      // Filter components if they exist
      if (currentExportData.components) {
        const filtered = currentExportData.components.filter(c => 
          c.componentName.toLowerCase().includes(q) ||
          (c.frameName && c.frameName.toLowerCase().includes(q)) ||
          c.sections.some(s => s.variantType.toLowerCase().includes(q))
        );
        output.value = JSON.stringify({
          filterQuery: q,
          matchedComponentsCount: filtered.length,
          components: filtered
        }, null, 2);
        outputBadge.textContent = 'Filtered: ' + filtered.length + ' matches';
      }
    };

    // Card click filter shortcuts
    document.getElementById('card-components').onclick = () => {
      if (currentExportData && currentExportData.components) {
        output.value = JSON.stringify({ components: currentExportData.components }, null, 2);
        outputBadge.textContent = 'Components Only';
      }
    };

    document.getElementById('card-variants').onclick = () => {
      if (currentExportData && currentExportData.components) {
        output.value = JSON.stringify(currentExportData, null, 2);
        outputBadge.textContent = 'All Variants';
      }
    };

    document.getElementById('card-variables').onclick = () => {
      if (currentExportData && currentExportData.variables) {
        output.value = JSON.stringify({ variables: currentExportData.variables }, null, 2);
        outputBadge.textContent = 'Variables Only';
      }
    };

    document.getElementById('card-styles').onclick = () => {
      if (currentExportData && currentExportData.styles) {
        output.value = JSON.stringify({ styles: currentExportData.styles }, null, 2);
        outputBadge.textContent = 'Styles Only';
      }
    };

    // Message receiver from Figma plugin backend
    onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'export-result') {
        currentExportData = msg.data;
        const jsonStr = JSON.stringify(msg.data, null, 2);
        output.value = jsonStr;

        if (msg.category === 'all') {
          if (msg.data.extractedSummary) {
            const s = msg.data.extractedSummary;
            valComponents.textContent = s.componentsCount;
            valVariants.textContent = s.totalVariantsCount.toLocaleString();
            valVariables.textContent = s.variablesCount;
            valStyles.textContent = s.stylesCount;
            setStatus('✅ Extracted ' + s.componentsCount + ' components (' + s.totalVariantsCount + ' variants), ' + s.variablesCount + ' variables, ' + s.stylesCount + ' styles!', 'success');
          } else {
            setStatus('✅ Full Design System exported successfully!', 'success');
          }
          outputBadge.textContent = 'Complete Export';
        } else if (msg.category === 'tokens') {
          const varCount = (msg.data.variables && msg.data.variables.variables) ? msg.data.variables.variables.length : 0;
          const styleCount = (msg.data.styles) ? (Object.keys(msg.data.styles.colors || {}).length + Object.keys(msg.data.styles.typography || {}).length) : 0;
          valVariables.textContent = varCount;
          valStyles.textContent = styleCount;
          setStatus('✅ Exported ' + varCount + ' variables and ' + styleCount + ' styles!', 'success');
          outputBadge.textContent = 'Tokens Only';
        } else {
          setStatus('✅ Export completed successfully!', 'success');
          outputBadge.textContent = 'Exported';
        }
      } else if (msg.type === 'export-error') {
        setStatus('❌ Error: ' + msg.error, 'error');
        output.value = 'Error details:\n' + msg.error;
        outputBadge.textContent = 'Error';
      }
    };
  </script>
</body>
</html>`;

fs.writeFileSync('ui.html', htmlContent, 'utf8');
console.log('✅ Successfully created newly innovated ui.html with purple cosmic background and all original exporter features!');
