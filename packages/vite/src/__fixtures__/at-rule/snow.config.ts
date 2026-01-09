import type { UserConfig } from '@snowcss/internal'
import { defineConfig } from '@snowcss/internal'

const config: UserConfig = await defineConfig({
  inject: 'at-rule',
  tokens: {
    color: {
      primary: '#ff0000',
      secondary: '#00ff00',
    },
    size: {
      4: '1rem',
      8: '2rem',
      16: '16px',
    },
  },
})

export default config
