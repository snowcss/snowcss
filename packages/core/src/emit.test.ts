import { describe, expect, it } from 'vitest'

import { Config, defineConfig } from './config'
import { emit } from './emit'
import { resolveAll } from './resolver'

/** Helper to create a test config. */
async function createConfig(tokens: Record<string, unknown>) {
  const userConfig = await defineConfig({
    tokens: tokens as Record<string, string>,
  })

  return Config.create(userConfig, '/test/path')
}

describe('emit', () => {
  it('emits single token as :root { --name: value; }', async () => {
    const config = await createConfig({
      color: '#ff0000',
    })
    const resolved = resolveAll(config)
    const css = emit(resolved)
    expect(css).toContain(':root')
    expect(css).toContain('--color')
    expect(css).toContain('#ff0000')
  })

  it('emits multiple tokens with proper formatting', async () => {
    const config = await createConfig({
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
      },
    })
    const resolved = resolveAll(config)
    const css = emit(resolved)
    expect(css).toContain('--colors-primary')
    expect(css).toContain('--colors-secondary')
    expect(css).toContain(':root {')
    expect(css).toContain('}')
  })

  it('minified output removes whitespace and newlines', async () => {
    const config = await createConfig({
      a: '1',
      b: '2',
    })
    const resolved = resolveAll(config)
    const css = emit(resolved, { minify: true })
    expect(css).not.toContain('\n')
    expect(css).toMatch(/^:root\{.*\}$/)
  })

  it('returns null when no tokens provided', () => {
    const css = emit([])
    expect(css).toBeNull()
  })

  it('handles empty iterable gracefully', () => {
    const empty: Array<never> = []
    const css = emit(empty)
    expect(css).toBeNull()
  })

  it('generates valid CSS variable declarations', async () => {
    const config = await createConfig({
      size: {
        base: '16px',
      },
    })
    const resolved = resolveAll(config)
    const css = emit(resolved)
    expect(css).toMatch(/--size-base:\s*16px;/)
  })

  it('escapes dots in segment names for CSS variables', async () => {
    const config = await createConfig({
      size: {
        '0.5': '8px',
      },
    })
    const resolved = resolveAll(config)
    const css = emit(resolved)
    expect(css).toContain('--size-0\\.5')
  })
})
