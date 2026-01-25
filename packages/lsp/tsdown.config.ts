import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  external: ['jiti'],
  noExternal: ['@snowcss/internal', '@snowcss/internal/shared'],
  minify: true,
  inputOptions: {
    resolve: {
      alias: {
        'css-tree': 'css-tree/dist/csstree.esm',
      },
    },
  },
})

export default config
