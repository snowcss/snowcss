import { describe, expect, it } from 'vitest'

import { AlphaModifier, UnitModifier } from './modifier'
import { RawParser, RawValue } from './value'

describe('RawValue', () => {
  it('stores raw string value', () => {
    const value = new RawValue('some-value')
    expect(value.raw).toBe('some-value')
  })

  describe('apply', () => {
    it('returns null for UnitModifier', () => {
      const value = new RawValue('16px')
      const modifier = new UnitModifier('rem')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })

    it('returns null for AlphaModifier', () => {
      const value = new RawValue('#fff')
      const modifier = new AlphaModifier(0.5)
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })
  })
})

describe('RawParser', () => {
  describe('tryParse', () => {
    it('always returns RawValue with input', () => {
      const parser = new RawParser()
      const result = parser.tryParse({
        input: 'arbitrary-value',
        node: { type: 'Identifier', name: 'arbitrary-value' },
      })
      expect(result).toBeInstanceOf(RawValue)
      expect((result as RawValue).raw).toBe('arbitrary-value')
    })

    it('handles any node type', () => {
      const parser = new RawParser()
      const result = parser.tryParse({
        input: '10%',
        node: { type: 'Percentage', value: '10' },
      })
      expect(result).toBeInstanceOf(RawValue)
      expect((result as RawValue).raw).toBe('10%')
    })
  })
})
