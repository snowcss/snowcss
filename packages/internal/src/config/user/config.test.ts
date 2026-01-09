import { describe, expect, it } from 'vitest'

import { defineConfig } from './config'
import { defineTokens } from './tokens'

describe('defineConfig', () => {
  it('accepts plain config object', async () => {
    const config = await defineConfig({
      tokens: { color: '#fff' },
    })
    expect(config.tokens.color).toBe('#fff')
  })

  it('accepts function returning config', async () => {
    const config = await defineConfig(() => ({
      tokens: { color: '#fff' },
    }))
    expect(config.tokens.color).toBe('#fff')
  })

  it('accepts async function returning config', async () => {
    const config = await defineConfig(async () => ({
      tokens: { color: '#fff' },
    }))
    expect(config.tokens.color).toBe('#fff')
  })

  it('merges multiple of token objects', async () => {
    const colors1 = defineTokens({ colors: { primary: '#f00' } })
    const colors2 = defineTokens({ colors: { secondary: '#0f0' } })
    const config = await defineConfig({
      tokens: [colors1(), colors2()],
    })
    expect(config.tokens.colors.primary).toBe('#f00')
    expect(config.tokens.colors.secondary).toBe('#0f0')
  })

  it('sets default inject to asset', async () => {
    const config = await defineConfig({
      tokens: { color: '#fff' },
    })
    expect(config.inject).toBe('asset')
  })

  it('sets default rootFontSize to 16', async () => {
    const config = await defineConfig({
      tokens: { color: '#fff' },
    })
    expect(config.rootFontSize).toBe(16)
  })

  it('preserves user-provided inject value', async () => {
    const config = await defineConfig({
      inject: 'inline',
      tokens: { color: '#fff' },
    })
    expect(config.inject).toBe('inline')
  })

  it('preserves user-provided rootFontSize value', async () => {
    const config = await defineConfig({
      rootFontSize: 14,
      tokens: { color: '#fff' },
    })
    expect(config.rootFontSize).toBe(14)
  })

  it('preserves user-provided prefix', async () => {
    const config = await defineConfig({
      prefix: 'myapp',
      tokens: { color: '#fff' },
    })
    expect(config.prefix).toBe('myapp')
  })

  it('infers token types correctly', async () => {
    const config = await defineConfig({
      tokens: {
        colors: { primary: '#f00', secondary: '#0f0' },
        size: { base: '16px' },
      },
    })
    // TypeScript should infer these as string without type assertions.
    const primary: string = config.tokens.colors.primary
    const base: string = config.tokens.size.base
    expect(primary).toBe('#f00')
    expect(base).toBe('16px')
  })
})
