import { defineConfig } from '@snowcss/core'

export default defineConfig({
  inject: 'asset',
  tokens: {
    color: {
      primary: '#ff0000',
    },
  },
})
