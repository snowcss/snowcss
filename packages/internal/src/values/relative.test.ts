import { describe, expect, it } from 'vitest'

import { AlphaModifier, UnitModifier } from './modifier'
import { RemParser, RemValue } from './relative'

describe('RemValue', () => {
  it('stores raw and parsed values', () => {
    const value = new RemValue('1rem', 1)
    expect(value.raw).toBe('1rem')
    expect(value.parsed).toBe(1)
  })

  describe('apply', () => {
    it('returns same value for to rem modifier', () => {
      const value = new RemValue('1rem', 1)
      const modifier = new UnitModifier('rem')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBe('1rem')
    })

    it('converts to px using rootFontSize', () => {
      const value = new RemValue('2rem', 2)
      const modifier = new UnitModifier('px')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBe('32px')
    })

    it('handles decimal rem values', () => {
      const value = new RemValue('1.5rem', 1.5)
      const modifier = new UnitModifier('px')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBe('24px')
    })

    it('returns null for AlphaModifier', () => {
      const value = new RemValue('1rem', 1)
      const modifier = new AlphaModifier(0.5)
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })
  })
})

describe('RemParser', () => {
  describe('tryParse', () => {
    it('parses dimension node with rem unit', () => {
      const parser = new RemParser()
      const result = parser.tryParse({
        input: '1rem',
        node: { type: 'Dimension', value: '1', unit: 'rem' },
      })
      expect(result).toBeInstanceOf(RemValue)
      expect((result as RemValue).raw).toBe('1rem')
      expect((result as RemValue).parsed).toBe(1)
    })

    it('parses decimal values', () => {
      const parser = new RemParser()
      const result = parser.tryParse({
        input: '0.75rem',
        node: { type: 'Dimension', value: '0.75', unit: 'rem' },
      })
      expect(result).toBeInstanceOf(RemValue)
      expect((result as RemValue).parsed).toBe(0.75)
    })

    it('returns null for non-rem dimensions', () => {
      const parser = new RemParser()
      const result = parser.tryParse({
        input: '16px',
        node: { type: 'Dimension', value: '16', unit: 'px' },
      })
      expect(result).toBeNull()
    })

    it('returns null for non-dimension nodes', () => {
      const parser = new RemParser()
      const result = parser.tryParse({
        input: '1',
        node: { type: 'Number', value: '1' },
      })
      expect(result).toBeNull()
    })
  })
})
