import snowcss from '@snowcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  vite: {
    plugins: [snowcss()],
  },
})
