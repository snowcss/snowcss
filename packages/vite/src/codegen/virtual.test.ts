import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { Context } from '#context'

import { generateVirtualModule } from './virtual'

const FIXTURES_ROOT = resolve(__dirname, '../__fixtures__/at-rule')

describe('generateVirtualModule', () => {
  it('includes all tokens when no filters provided', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context)

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).toContain('"secondary":"#00ff00"')
    expect(result).toContain('"4":"1rem"')
    expect(result).toContain('"8":"2rem"')
  })

  it('includes all tokens when empty filters array provided', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, [])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).toContain('"secondary":"#00ff00"')
    expect(result).toContain('"4":"1rem"')
  })

  it('filters tokens with exact match', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['color.primary'])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).not.toContain('"secondary":"#00ff00"')
    expect(result).not.toContain('"4":"1rem"')
  })

  it('filters tokens with multiple exact matches', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['color.primary', 'size.4'])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).not.toContain('"secondary":"#00ff00"')
    expect(result).toContain('"4":"1rem"')
    expect(result).not.toContain('"8":"2rem"')
  })

  it('filters tokens with wildcard pattern', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['color.*'])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).toContain('"secondary":"#00ff00"')
    expect(result).not.toContain('"4":"1rem"')
    expect(result).not.toContain('"8":"2rem"')
  })

  it('filters tokens with namespace wildcard pattern', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['size.*'])

    expect(result).not.toContain('"primary":"#ff0000"')
    expect(result).not.toContain('"secondary":"#00ff00"')
    expect(result).toContain('"4":"1rem"')
    expect(result).toContain('"8":"2rem"')
  })

  it('filters tokens with RegExp pattern', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, [/^color\./])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).toContain('"secondary":"#00ff00"')
    expect(result).not.toContain('"4":"1rem"')
  })

  it('filters tokens with RegExp matching substring', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, [/primary/])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).not.toContain('"secondary":"#00ff00"')
    expect(result).not.toContain('"4":"1rem"')
  })

  it('filters tokens with mixed patterns', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['color.primary', /^size\./])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).not.toContain('"secondary":"#00ff00"')
    expect(result).toContain('"4":"1rem"')
    expect(result).toContain('"8":"2rem"')
  })

  it('handles numeric token segments', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['size.4'])

    expect(result).toContain('"4":"1rem"')
    expect(result).not.toContain('"8":"2rem"')
  })

  it('wildcard pattern does not match unrelated namespaces', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    // 'color.*' should match 'color.primary' but not 'colors.primary' if it existed.
    const result = generateVirtualModule(context, ['color.*'])

    expect(result).toContain('"primary":"#ff0000"')
    expect(result).toContain('"secondary":"#00ff00"')
    // Verify size tokens are excluded.
    expect(result).not.toContain('"4":"1rem"')
  })

  it('returns empty registry when no tokens match', async () => {
    const context = await Context.create({
      root: FIXTURES_ROOT,
    })

    const result = generateVirtualModule(context, ['nonexistent.*'])

    // Should generate valid JavaScript but with empty registry.
    expect(result).toContain('const REGISTRY')
    expect(result).toContain('Object.freeze({})')
  })
})
