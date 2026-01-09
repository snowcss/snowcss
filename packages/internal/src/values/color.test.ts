import type { CssNode } from 'css-tree'
import type { Color } from 'culori'
import { parse } from 'culori'
import { describe, expect, it } from 'vitest'

import { ColorParser, ColorValue } from './color'
import { AlphaModifier, UnitModifier } from './modifier'

/** Helper to parse color and assert it's valid. */
function parseColor(input: string): Color {
  const color = parse(input)
  if (!color) throw new Error(`Failed to parse color: ${input}`)
  return color
}

describe('ColorValue', () => {
  it('stores raw, hex flag, and color object', () => {
    const color = parseColor('#ff0000')
    const value = new ColorValue('#ff0000', true, color)
    expect(value.raw).toBe('#ff0000')
    expect(value.hex).toBe(true)
    expect(value.color).toBe(color)
  })

  describe('apply', () => {
    it('applies AlphaModifier to hex color', () => {
      const color = parseColor('#ff0000')
      const value = new ColorValue('#ff0000', true, color)
      const modifier = new AlphaModifier(0.5)
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBe('#ff000080')
    })

    it('applies AlphaModifier to rgb color', () => {
      const color = parseColor('rgb(255, 0, 0)')
      const value = new ColorValue('rgb(255, 0, 0)', false, color)
      const modifier = new AlphaModifier(0.5)
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBe('rgba(255, 0, 0, 0.5)')
    })

    it('returns null for UnitModifier', () => {
      const color = parseColor('#ff0000')
      const value = new ColorValue('#ff0000', true, color)
      const modifier = new UnitModifier('px')
      const ctx = { rootFontSize: 16 }
      expect(value.apply(modifier, ctx)).toBeNull()
    })
  })

  describe('toHex', () => {
    it('returns hex8 format for opaque color (alpha undefined)', () => {
      // Note: culori doesn't set alpha for opaque colors, so toHex() uses hex8 format.
      const color = parseColor('#ff0000')
      const value = new ColorValue('#ff0000', true, color)
      expect(value.toHex()).toBe('#ff0000ff')
    })

    it('returns hex8 format for transparent color', () => {
      const color = parseColor('#ff000080')
      const value = new ColorValue('#ff000080', true, color)
      expect(value.toHex()).toBe('#ff000080')
    })

    it('returns hex format when alpha is explicitly 1', () => {
      const color = { ...parseColor('#ff0000'), alpha: 1 }
      const value = new ColorValue('#ff0000', true, color)
      expect(value.toHex()).toBe('#ff0000')
    })
  })

  describe('toCss', () => {
    it('returns hex8 format when source is hex (alpha undefined)', () => {
      const color = parseColor('#ff0000')
      const value = new ColorValue('#ff0000', true, color)
      expect(value.toCss()).toBe('#ff0000ff')
    })

    it('returns rgb format for rgb source', () => {
      const color = parseColor('rgb(255, 0, 0)')
      const value = new ColorValue('rgb(255, 0, 0)', false, color)
      expect(value.toCss()).toBe('rgb(255, 0, 0)')
    })
  })

  describe('toRgba', () => {
    it('converts hex to RGBA', () => {
      const color = parseColor('#ff0000')
      const value = new ColorValue('#ff0000', true, color)
      const rgba = value.toRgba()
      expect(rgba.r).toBe(1)
      expect(rgba.g).toBe(0)
      expect(rgba.b).toBe(0)
      expect(rgba.alpha).toBe(1)
    })

    it('handles alpha channel', () => {
      const color = parseColor('rgba(255, 0, 0, 0.5)')
      const value = new ColorValue('rgba(255, 0, 0, 0.5)', false, color)
      const rgba = value.toRgba()
      expect(rgba.alpha).toBe(0.5)
    })
  })
})

describe('ColorParser', () => {
  describe('tryParse', () => {
    it('parses hex colors', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: '#ff0000',
        node: { type: 'Hash', value: 'ff0000' } as CssNode,
      })
      expect(result).toBeInstanceOf(ColorValue)
      expect((result as ColorValue).hex).toBe(true)
    })

    it('parses shorthand hex colors', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: '#f00',
        node: { type: 'Hash', value: 'f00' } as CssNode,
      })
      expect(result).toBeInstanceOf(ColorValue)
    })

    it('parses rgb function colors', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: 'rgb(255, 0, 0)',
        node: { type: 'Function', name: 'rgb' } as CssNode,
      })
      expect(result).toBeInstanceOf(ColorValue)
      expect((result as ColorValue).hex).toBe(false)
    })

    it('parses hsl function colors', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: 'hsl(0, 100%, 50%)',
        node: { type: 'Function', name: 'hsl' } as CssNode,
      })
      expect(result).toBeInstanceOf(ColorValue)
    })

    it('parses named colors', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: 'red',
        node: { type: 'Identifier', name: 'red' } as CssNode,
      })
      expect(result).toBeInstanceOf(ColorValue)
    })

    it('returns null for non-color identifiers', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: 'auto',
        node: { type: 'Identifier', name: 'auto' } as CssNode,
      })
      expect(result).toBeNull()
    })

    it('returns null for dimension nodes', () => {
      const parser = new ColorParser()
      const result = parser.tryParse({
        input: '16px',
        node: { type: 'Dimension', value: '16', unit: 'px' } as CssNode,
      })
      expect(result).toBeNull()
    })
  })
})
