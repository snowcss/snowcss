import { describe, expect, it } from 'vitest'

import { Config } from './config'
import { defineConfig } from './config/user'
import { extract } from './extract'
import { SnowFunctionName } from './functions'
import { Path } from './path'
import { ResolvedToken, resolve, resolveAll } from './resolver'

/** Helper to create a test config. */
async function createConfig(tokens: Record<string, unknown>, prefix?: string) {
  const userConfig = await defineConfig({
    prefix,
    tokens: tokens as Record<string, string>,
  })

  return Config.create(userConfig, '/test/path')
}

describe('resolve', () => {
  it('resolves TokenFunction to CSS variable reference', async () => {
    const config = await createConfig({ colors: { primary: '#ff0000' } })
    const css = '.test { color: --token("colors.primary"); }'
    const [functions] = extract(css)
    const [resolved] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toBe('var(--colors-primary)')
  })

  it('resolves ValueFunction without modifier to raw token value', async () => {
    const config = await createConfig({ colors: { primary: '#ff0000' } })
    const css = '.test { color: --value("colors.primary"); }'
    const [functions] = extract(css)
    const [resolved] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toBe('#ff0000')
  })

  it('resolves ValueFunction with alpha modifier, applying to color', async () => {
    const config = await createConfig({ colors: { primary: '#ff0000' } })
    const css = '.test { color: --value("colors.primary" / 50%); }'
    const [functions] = extract(css)
    const [resolved] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toMatch(/50|80/)
  })

  it('resolves ValueFunction with unit modifier (px to rem)', async () => {
    const config = await createConfig({ size: { base: '16px' } })
    const css = '.test { font-size: --value("size.base" to rem); }'
    const [functions] = extract(css)
    const [resolved] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toBe('1rem')
  })

  it('resolves ValueFunction with unit modifier (rem to px)', async () => {
    const config = await createConfig({ size: { base: '2rem' } })
    const css = '.test { font-size: --value("size.base" to px); }'
    const [functions] = extract(css)
    const [resolved] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toBe('32px')
  })

  it('warns when token path not found in config', async () => {
    const config = await createConfig({ colors: { primary: '#ff0000' } })
    const css = '.test { color: --token("colors.nonexistent"); }'
    const [functions] = extract(css)
    const [resolved, diagnostics] = resolve(config, functions)
    expect(resolved).toHaveLength(0)
    expect(diagnostics.size).toBeGreaterThan(0)
  })

  it('warns when applying modifier to multi-value token', async () => {
    const config = await createConfig({ spacing: { inset: '1px 2px 3px 4px' } })
    const css = '.test { padding: --value("spacing.inset" to rem); }'
    const [functions] = extract(css)
    const [resolved, diagnostics] = resolve(config, functions)
    expect(resolved).toHaveLength(1)
    expect(resolved[0].toCss()).toBe('1px 2px 3px 4px')
    expect(diagnostics.size).toBeGreaterThan(0)
  })
})

describe('resolveAll', () => {
  it('resolves all tokens from config', async () => {
    const config = await createConfig({
      colors: { primary: '#ff0000', secondary: '#00ff00' },
      size: { base: '16px' },
    })
    const resolved = resolveAll(config)
    expect(resolved).toHaveLength(3)
  })

  it('creates virtual ValueFunction for each token', async () => {
    const config = await createConfig({ color: '#fff' })
    const resolved = resolveAll(config)
    expect(resolved[0].name).toBe(SnowFunctionName.Value)
  })
})

describe('ResolvedToken', () => {
  describe('toCss', () => {
    it('returns variable reference for Token function', () => {
      const path = Path.fromDotPath('colors.primary')
      const resolved = new ResolvedToken(SnowFunctionName.Token, path, [], ['#ff0000'], {
        start: 0,
        end: 10,
      })
      expect(resolved.toCss()).toBe('var(--colors-primary)')
    })

    it('returns joined resolved values for Value function', () => {
      const path = Path.fromDotPath('colors.primary')
      const resolved = new ResolvedToken(SnowFunctionName.Value, path, [], ['1px', '2px'], {
        start: 0,
        end: 10,
      })
      expect(resolved.toCss()).toBe('1px 2px')
    })
  })
})
