import { describe, expect, it } from 'vitest'

import { defineTokens } from './tokens'

const source = {
  color: '#fff',
  colors: {
    primary: '#f00',
    secondary: '#0f0',
  },
  size: {
    '0.5': '8px',
  },
}

const tokens = defineTokens(source)

/** Calls the token accessor with a path outside its typed surface to probe runtime descent. */
function getUntyped(path: string): unknown {
  return (tokens as (path: string, options: { as: 'value' }) => unknown)(path, { as: 'value' })
}

/** Calls the ref accessor with a path outside its typed surface to probe the runtime guard. */
function getRefUntyped(path: string): unknown {
  return (tokens as (path: string) => unknown)(path)
}

describe('defineTokens', () => {
  describe('call without arguments', () => {
    it('returns the tokens object structure', () => {
      expect(tokens()).toEqual(source)
    })

    it('returns the same tokens reference', () => {
      expect(tokens()).toBe(source)
    })
  })

  describe('call with a path (ref mode)', () => {
    it('returns a CSS variable reference for a leaf path', () => {
      expect(tokens('colors.primary')).toBe('var(--colors-primary)')
    })

    it('throws when referencing a namespace path', () => {
      expect(() => getRefUntyped('colors')).toThrow()
    })

    it('defaults to ref mode when no options are given', () => {
      expect(tokens('colors.primary')).toBe(tokens('colors.primary', { as: 'ref' }))
    })

    it('escapes dots in numeric segments', () => {
      expect(tokens('size.0.5')).toBe('var(--size-0\\.5)')
    })
  })

  describe('call with a path (value mode)', () => {
    it('returns the literal value for a leaf path', () => {
      expect(tokens('colors.primary', { as: 'value' })).toBe('#f00')
    })

    it('returns the subtree object for a namespace path', () => {
      expect(tokens('colors', { as: 'value' })).toEqual(source.colors)
    })

    it('resolves a value across numeric segments', () => {
      expect(tokens('size.0.5', { as: 'value' })).toBe('8px')
    })

    it('returns the string leaf when descending past it', () => {
      expect(getUntyped('color.foo')).toBe('#fff')
    })

    it('returns undefined for a missing path', () => {
      expect(getUntyped('nope')).toBeUndefined()
    })
  })

  describe('map', () => {
    it('calls the function with the tokens and returns its result', () => {
      const mapped = tokens.map((current) => ({ ...current, extra: '#000' }))
      expect(mapped).toEqual({ ...source, extra: '#000' })
    })
  })

  describe('extend', () => {
    it('adds sibling keys', () => {
      const extended = tokens.extend({ colors: { tertiary: '#00f' } })
      expect(extended).toEqual({ ...source, colors: { ...source.colors, tertiary: '#00f' } })
    })

    it('preserves existing nested keys while adding new namespaces', () => {
      const extended = tokens.extend({ radius: { base: '4px' } })
      expect(extended).toEqual({ ...source, radius: { base: '4px' } })
    })

    it('overrides an overlapping leaf with the extension value', () => {
      const extended = tokens.extend({ colors: { primary: '#00f' } })
      expect(extended).toEqual({ ...source, colors: { ...source.colors, primary: '#00f' } })
    })
  })
})
