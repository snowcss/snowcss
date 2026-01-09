import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { Context } from './context'

const FIXTURES_ATRULE_ROOT = resolve(__dirname, '__fixtures__/at-rule')

describe('Context', () => {
  describe('create', () => {
    it('creates context from config path', async () => {
      const ctx = await Context.create({
        root: FIXTURES_ATRULE_ROOT,
      })

      expect(ctx.config).toBeDefined()
      expect(ctx.config.tokens).toHaveLength(5)
    })
  })

  describe('collect', () => {
    it('extracts and resolves --token() calls from CSS', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { color: --token('color.primary'); }`

      const [resolved, diagnostics] = ctx.collect(css)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].path.toDotPath()).toBe('color.primary')
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('extracts and resolves --value() calls from CSS', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { padding: --value('size.4'); }`

      const [resolved, diagnostics] = ctx.collect(css)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].toCss()).toBe('1rem')
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('accumulates tokens across multiple collect calls', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      ctx.collect(`.a { color: --token('color.primary'); }`)
      ctx.collect(`.b { color: --token('color.secondary'); }`)

      const css = ctx.emitCss()

      expect(css).toContain('--color-primary')
      expect(css).toContain('--color-secondary')
    })

    it('returns diagnostics for invalid token paths', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { color: --token('color.nonexistent'); }`

      const [resolved, diagnostics] = ctx.collect(css)

      expect(resolved).toHaveLength(0)
      expect(diagnostics.size).toBeGreaterThan(0)
    })
  })

  describe('replace', () => {
    it('replaces --token() calls with CSS variable references', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { color: --token('color.primary'); }`

      const [resolved] = ctx.collect(css)
      const result = ctx.replace(css, resolved)

      expect(result).toBe('.test { color: var(--color-primary); }')
    })

    it('replaces --value() calls with resolved values', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { padding: --value('size.4'); }`

      const [resolved] = ctx.collect(css)
      const result = ctx.replace(css, resolved)

      expect(result).toBe('.test { padding: 1rem; }')
    })

    it('handles multiple replacements in correct order', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = `.test { color: --token('color.primary'); padding: --value('size.4'); }`

      const [resolved] = ctx.collect(css)
      const result = ctx.replace(css, resolved)

      expect(result).toBe('.test { color: var(--color-primary); padding: 1rem; }')
    })
  })

  describe('emitAllCss', () => {
    it('generates CSS for all config tokens', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = ctx.emitAllCss()

      expect(css).toContain('--color-primary')
      expect(css).toContain('--color-secondary')
      expect(css).toContain('--size-4')
      expect(css).toContain('--size-8')
      expect(css).toContain('--size-16')
    })

    it('respects minify option', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = ctx.emitAllCss({ minify: true })

      expect(css).not.toContain('\n')
    })
  })

  describe('emitCss', () => {
    it('generates CSS only for collected tokens', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      ctx.collect(`.test { color: --token('color.primary'); }`)

      const css = ctx.emitCss()

      expect(css).toContain('--color-primary')
      expect(css).not.toContain('--color-secondary')
      expect(css).not.toContain('--size-4')
    })

    it('returns null when no tokens collected', async () => {
      const ctx = await Context.create({ root: FIXTURES_ATRULE_ROOT })
      const css = ctx.emitCss()

      expect(css).toBeNull()
    })
  })
})
