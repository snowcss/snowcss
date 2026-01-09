import { describe, expect, it } from 'vitest'

import { Path } from './path'

describe('Path', () => {
  describe('fromDotPath', () => {
    it('splits path on dots', () => {
      const path = Path.fromDotPath('colors.primary.500')
      expect(path.segments).toEqual(['colors', 'primary', '500'])
    })

    it('preserves numeric segments like 0.5', () => {
      const path = Path.fromDotPath('size.0.5')
      expect(path.segments).toEqual(['size', '0.5'])
    })

    it('trims whitespace from segments', () => {
      const path = Path.fromDotPath(' foo . bar . baz ')
      expect(path.segments).toEqual(['foo', 'bar', 'baz'])
    })

    it('handles single segment', () => {
      const path = Path.fromDotPath('primary')
      expect(path.segments).toEqual(['primary'])
    })

    it('handles empty string', () => {
      const path = Path.fromDotPath('')
      expect(path.segments).toEqual([])
    })
  })

  describe('toDotPath', () => {
    it('joins segments with dots', () => {
      const path = new Path(['colors', 'primary', '500'])
      expect(path.toDotPath()).toBe('colors.primary.500')
    })

    it('handles single segment', () => {
      const path = new Path(['primary'])
      expect(path.toDotPath()).toBe('primary')
    })
  })

  describe('toCssVar', () => {
    it('returns CSS variable name with dashes', () => {
      const path = new Path(['colors', 'primary', '500'])
      expect(path.toCssVar()).toBe('--colors-primary-500')
    })

    it('escapes dots in segment names', () => {
      const path = new Path(['size', '0.5'])
      expect(path.toCssVar()).toBe('--size-0\\.5')
    })

    it('handles single segment', () => {
      const path = new Path(['primary'])
      expect(path.toCssVar()).toBe('--primary')
    })
  })

  describe('toCssVarRef', () => {
    it('wraps CSS variable in var()', () => {
      const path = new Path(['colors', 'primary'])
      expect(path.toCssVarRef()).toBe('var(--colors-primary)')
    })
  })

  describe('toString', () => {
    it('returns dot path', () => {
      const path = new Path(['foo', 'bar', 'baz'])
      expect(path.toString()).toBe('foo.bar.baz')
    })
  })
})
