import { defineConfig } from '@snowcss/internal'

export default defineConfig({
  inject: 'asset',
  tokens: {
    color: {
      primary: '#ff0000',
    },
  },
})
