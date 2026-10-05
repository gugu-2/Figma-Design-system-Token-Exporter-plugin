# Figma Design System Export Plugin

This plugin extracts your local styles (Color Styles, Text Styles, Effect Styles, and Layout Grids) and converts them into a structured JSON file containing your Design Tokens. 

## How to use this plugin:

1. Open the Figma desktop app.
2. Go to **Plugins > Development > Import plugin from manifest...**.
3. Select the `manifest.json` file in this directory.
4. Run the plugin.
5. You now have two options:
   - **"Extract Tokens"**: Extracts your Color, Text, Effect, and Grid styles.
   - **"Extract Components"**: Scans your "⛩ Design System (Overview)" page (or the current page) and extracts the architecture of all your Components and Component Sets (including their variants, paddings, auto-layout settings, and sizes).
6. The JSON output will be displayed. Click **"Copy JSON"** to copy it to your clipboard.

## Features:

- **Component Architecture**: Extracts all Components and Component Sets, documenting variants, auto-layout modes, paddings, and sizes for developers.
- **Color Styles**: Exports solid colors, including opacity (RGBA) or hex formatting.
- **Typography**: Exports font family, weight, size, letter spacing, and line height.
- **Effects**: Exports drop shadows, inner shadows, and blur properties (radius, offset, spread, visibility).
- **Layout Grids**: Exports column, row, and grid setups (count, gutter, margin, offset, section size).
