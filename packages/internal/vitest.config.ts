import { resolve } from 'node:path'

import type { UserConfig } from 'vite'
import { defineConfig } from 'vitest/config'

const config: UserConfig = defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})

export default config
