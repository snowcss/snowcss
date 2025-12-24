import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  exports: {
    devExports: 'snowcss',
  },
  dts: {
    sourcemap: true,
  },
})
