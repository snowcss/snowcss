# Snow CSS IntelliSense

Visual Studio Code extension providing IntelliSense for [Snow CSS](https://github.com/snowcss/snowcss). Powered by the `@snowcss/lsp` language server.

## Features

- **Completions** for token paths, function names, and modifiers (`to px`, `to rem`, `negate`, alpha).
- **Diagnostics** for invalid token references, incompatible modifiers, and multi-value token misuse.
- **Hover** documentation showing resolved token values and applied modifiers.
- **Inlay hints** displaying resolved values inline (color hex codes, px equivalents, etc).
- **Color decorators** for color tokens referenced in CSS.
- **Syntax highlighting** for Snow CSS functions injected into CSS, SCSS, SASS, Less, Vue, Svelte, and Astro.

## Requirements

The extension requires the `@snowcss/lsp` language server. It will search for the `snowcss-lsp` executable in your workspace `node_modules/.bin` and then in your global PATH. If not found, you'll be prompted to install it.

```sh
# Install locally
pnpm add -D @snowcss/lsp

# Or globally
pnpm add -g @snowcss/lsp
```

## Configuration

| Setting                           | Type              | Default | Description                                                      |
| --------------------------------- | ----------------- | ------- | ---------------------------------------------------------------- |
| `snowcss.lsp.path`                | `string`          | `null`  | Custom path to the `snowcss-lsp` executable.                     |
| `snowcss.diagnostics`             | `boolean \| null` | `null`  | Enable/disable diagnostics. Auto-detected when `null`.           |
| `snowcss.inlayHints`              | `boolean \| null` | `null`  | Enable/disable inlay hints. Auto-detected when `null`.           |
| `snowcss.hover.disableBuiltinCss` | `boolean`         | `false` | Disable VS Code's built-in CSS hover to show only Snow CSS info. |

## Commands

All commands are available via the Command Palette under the **Snow CSS** category.

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| **Restart Language Server** | Restart the LSP server.                    |
| **Reload Config**           | Reload `snow.config.*` without restarting. |
| **Open Config**             | Find and open the nearest `snow.config.*`. |
| **Show Output**             | Display the LSP output channel.            |

## License

[MIT](LICENSE).
