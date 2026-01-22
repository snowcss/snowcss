import type { UserConfig } from 'vite'
import { defineConfig } from 'vitest/config'

const config: UserConfig = defineConfig({
  test: {
    typecheck: {
      enabled: true,
      include: ['**/*.test-d.ts'],
    },
  },
})

export default config
