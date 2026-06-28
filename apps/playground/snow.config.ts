import { system } from '@snowcss/system'
import { defineConfig } from 'snowcss'

export default defineConfig({
  inject: 'asset',
  tokens: system(),
})
