# @snowcss/lsp

Language server for Snow CSS providing intelligent editor support for `--token()` and `--value()` functions.

## Features

### Completions

Context-aware suggestions for function names, token paths with natural sorting for numeric segments, value modifiers (`to px`, `to rem`, `negate`, alpha), and alpha percentages (5–100% in 5% steps). Trigger characters include quotes, dots, dashes, and `/`.

### Diagnostics

Validates that referenced token paths exist in the config and checks modifier compatibility. Reports errors for missing tokens and warnings for incompatible modifiers (e.g., alpha on non-color tokens, unit conversion on colors).

### Hover

Displays token documentation as CSS variable declarations with computed values. Shows unit conversions (px/rem) with original values in comments and resolved color values with alpha applied.

### Inlay hints

Shows resolved token values inline after function calls, including rem-to-px conversions. Values longer than 30 characters are truncated with ellipsis.

### Document colors

Renders inline color swatches for color tokens, respecting alpha modifiers when present. Read-only (colors are defined in config, not editable from CSS).

## Supported languages

Works natively with CSS, Sass, and PostCSS. For Vue, Svelte, Astro, and HTML the server detects and analyzes `<style>` blocks.

## Configuration

The server discovers the nearest `snow.config.{ts,cts,mts,js,cjs,mjs}` relative to each open document and watches for changes. A manual reload can be triggered via the `snowcss/reloadConfig` custom request.

Two settings are available under the `snowcss` section, both defaulting based on client capabilities:

| Setting               | Type      | Description                             |
| --------------------- | --------- | --------------------------------------- |
| `snowcss.diagnostics` | `boolean` | Enable or disable diagnostic reporting. |
| `snowcss.inlayHints`  | `boolean` | Enable or disable inlay hints.          |

## License

[MIT](LICENSE).
