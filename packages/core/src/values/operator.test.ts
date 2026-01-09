import { describe, expect, it } from 'vitest'

import { AlphaModifier, UnitModifier } from './modifier'
import { CommaParser, CommaValue } from './operator'

describe('CommaValue', () => {
  it('stores raw value', () => {
    const value = new CommaValue(',')
    expect(value.raw).toBe(',')
  })

  describe('apply', () => {
    it('returns null for UnitModifier', () => {
      const value = new CommaValue(',')
      const modifier = new UnitModifier('px')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })

    it('returns null for AlphaModifier', () => {
      const value = new CommaValue(',')
      const modifier = new AlphaModifier(0.5)
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })
  })
})

describe('CommaParser', () => {
  describe('tryParse', () => {
    it('parses comma operator', () => {
      const parser = new CommaParser()
      const result = parser.tryParse({
        input: ',',
        node: { type: 'Operator', value: ',' },
      })
      expect(result).toBeInstanceOf(CommaValue)
      expect((result as CommaValue).raw).toBe(',')
    })

    it('returns null for other operators', () => {
      const parser = new CommaParser()
      const result = parser.tryParse({
        input: '/',
        node: { type: 'Operator', value: '/' },
      })
      expect(result).toBeNull()
    })

    it('returns null for non-operator nodes', () => {
      const parser = new CommaParser()
      const result = parser.tryParse({
        input: 'test',
        node: { type: 'Identifier', name: 'test' },
      })
      expect(result).toBeNull()
    })
  })
})
