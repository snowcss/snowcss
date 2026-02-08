import type { UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts', 'src/shared.ts'],
  format: ['esm', 'cjs'],
  dts: true,
})

export default config
