import copy from 'rollup-plugin-copy'
import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  plugins: [
    copy({
      targets: [
        {
          src: 'src/codegen/runtime.js',
          dest: 'dist',
        },
      ],
    }),
  ],
})

export default config
