import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/extension.ts'],
  format: ['esm'],
  external: ['vscode'],
  noExternal: ['@snowcss/internal/shared'],
  dts: false,
  minify: true,
})

export default config
