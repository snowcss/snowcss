import { describe, expect, it } from 'vitest'

import { AlphaModifier, UnitModifier } from './modifier'

describe('UnitModifier', () => {
  it('stores unit value', () => {
    const px = new UnitModifier('px')
    const rem = new UnitModifier('rem')
    expect(px.unit).toBe('px')
    expect(rem.unit).toBe('rem')
  })

  describe('toCacheKey', () => {
    it('returns unit:px for px modifier', () => {
      const modifier = new UnitModifier('px')
      expect(modifier.toCacheKey()).toBe('unit:px')
    })

    it('returns unit:rem for rem modifier', () => {
      const modifier = new UnitModifier('rem')
      expect(modifier.toCacheKey()).toBe('unit:rem')
    })
  })
})

describe('AlphaModifier', () => {
  it('stores alpha value', () => {
    const modifier = new AlphaModifier(0.5)
    expect(modifier.value).toBe(0.5)
  })

  describe('toCacheKey', () => {
    it('returns alpha:{value} format', () => {
      const modifier = new AlphaModifier(0.5)
      expect(modifier.toCacheKey()).toBe('alpha:0.5')
    })

    it('handles integer alpha values', () => {
      const modifier = new AlphaModifier(1)
      expect(modifier.toCacheKey()).toBe('alpha:1')
    })

    it('handles zero alpha value', () => {
      const modifier = new AlphaModifier(0)
      expect(modifier.toCacheKey()).toBe('alpha:0')
    })
  })
})
