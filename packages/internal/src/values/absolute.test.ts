import { describe, expect, it } from 'vitest'

import { PxParser, PxValue } from './absolute'
import { AlphaModifier, UnitModifier } from './modifier'

describe('PxValue', () => {
  it('stores raw and parsed values', () => {
    const value = new PxValue('16px', 16)
    expect(value.raw).toBe('16px')
    expect(value.parsed).toBe(16)
  })

  describe('apply', () => {
    const ctx = { rootFontSize: 16 }

    it('returns same value for to px modifier', () => {
      const value = new PxValue('16px', 16)
      const modifier = new UnitModifier('px')
      expect(value.apply(modifier, ctx)).toBe('16px')
    })

    it('converts to rem using rootFontSize', () => {
      const value = new PxValue('32px', 32)
      const modifier = new UnitModifier('rem')
      expect(value.apply(modifier, ctx)).toBe('2rem')
    })

    it('handles non-integer rem conversions', () => {
      const value = new PxValue('24px', 24)
      const modifier = new UnitModifier('rem')
      expect(value.apply(modifier, ctx)).toBe('1.5rem')
    })

    it('returns null for AlphaModifier', () => {
      const value = new PxValue('16px', 16)
      const modifier = new AlphaModifier(0.5)
      expect(value.apply(modifier, ctx)).toBeNull()
    })
  })
})

describe('PxParser', () => {
  describe('tryParse', () => {
    it('parses dimension node with px unit', () => {
      const parser = new PxParser()
      const result = parser.tryParse({
        input: '16px',
        node: { type: 'Dimension', value: '16', unit: 'px' },
      })
      expect(result).toBeInstanceOf(PxValue)
      expect((result as PxValue).raw).toBe('16px')
      expect((result as PxValue).parsed).toBe(16)
    })

    it('parses decimal values', () => {
      const parser = new PxParser()
      const result = parser.tryParse({
        input: '1.5px',
        node: { type: 'Dimension', value: '1.5', unit: 'px' },
      })
      expect(result).toBeInstanceOf(PxValue)
      expect((result as PxValue).parsed).toBe(1.5)
    })

    it('returns null for non-px dimensions', () => {
      const parser = new PxParser()
      const result = parser.tryParse({
        input: '1rem',
        node: { type: 'Dimension', value: '1', unit: 'rem' },
      })
      expect(result).toBeNull()
    })

    it('returns null for non-dimension nodes', () => {
      const parser = new PxParser()
      const result = parser.tryParse({
        input: '16',
        node: { type: 'Number', value: '16' },
      })
      expect(result).toBeNull()
    })
  })
})
