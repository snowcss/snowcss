import { describe, expect, it } from 'vitest'

import { Path } from './path'
import { Token } from './token'
import { ColorValue, PxValue, RawValue, RemValue } from './values'

describe('Token', () => {
  describe('from', () => {
    it('creates token from array path and raw value', () => {
      const token = Token.from(['colors', 'primary'], '#ff0000')
      expect(token.path.segments).toEqual(['colors', 'primary'])
      expect(token.raw).toBe('#ff0000')
    })

    it('creates token from Path instance and raw value', () => {
      const path = new Path(['size', 'base'])
      const token = Token.from(path, '16px')
      expect(token.path).toBe(path)
      expect(token.raw).toBe('16px')
    })

    it('parses hex color value', () => {
      const token = Token.from(['colors', 'primary'], '#ff0000')
      expect(token.values).toHaveLength(1)
      expect(token.values[0]).toBeInstanceOf(ColorValue)
    })

    it('parses rgb color value', () => {
      const token = Token.from(['colors', 'primary'], 'rgb(255, 0, 0)')
      expect(token.values).toHaveLength(1)
      expect(token.values[0]).toBeInstanceOf(ColorValue)
    })

    it('parses px dimension value', () => {
      const token = Token.from(['size', 'base'], '16px')
      expect(token.values).toHaveLength(1)
      expect(token.values[0]).toBeInstanceOf(PxValue)
    })

    it('parses rem dimension value', () => {
      const token = Token.from(['size', 'base'], '1rem')
      expect(token.values).toHaveLength(1)
      expect(token.values[0]).toBeInstanceOf(RemValue)
    })

    it('parses multi-value tokens with spaces', () => {
      const token = Token.from(['spacing', 'inset'], '1px 2px 3px 4px')
      expect(token.values).toHaveLength(4)
      expect(token.values[0]).toBeInstanceOf(PxValue)
      expect(token.values[1]).toBeInstanceOf(PxValue)
      expect(token.values[2]).toBeInstanceOf(PxValue)
      expect(token.values[3]).toBeInstanceOf(PxValue)
    })

    it('falls back to RawValue for unknown formats', () => {
      const token = Token.from(['font', 'family'], 'Inter, sans-serif')
      expect(token.values.some((v) => v instanceof RawValue)).toBe(true)
    })
  })

  describe('toCacheKey', () => {
    it('returns consistent cache key for same path and value', () => {
      const token1 = Token.from(['colors', 'primary'], '#ff0000')
      const token2 = Token.from(['colors', 'primary'], '#ff0000')
      expect(token1.toCacheKey()).toBe(token2.toCacheKey())
    })

    it('returns different cache keys for different values', () => {
      const token1 = Token.from(['colors', 'primary'], '#ff0000')
      const token2 = Token.from(['colors', 'primary'], '#00ff00')
      expect(token1.toCacheKey()).not.toBe(token2.toCacheKey())
    })

    it('returns different cache keys for different paths', () => {
      const token1 = Token.from(['colors', 'primary'], '#ff0000')
      const token2 = Token.from(['colors', 'secondary'], '#ff0000')
      expect(token1.toCacheKey()).not.toBe(token2.toCacheKey())
    })
  })
})
