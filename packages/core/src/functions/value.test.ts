import type { CssNode, FunctionNode, List } from 'css-tree'
import { describe, expect, it } from 'vitest'

import { Diagnostics } from '#diagnostics'
import { Path } from '#path'
import { Token } from '#token'
import { AlphaModifier, NegateModifier, UnitModifier } from '#values'

import { SnowFunctionName } from './index'
import { ValueFunction, ValueFunctionParser } from './value'

/** Creates a mock FunctionNode for testing. */
function createFunctionNode(children: Array<CssNode>): FunctionNode {
  return {
    type: 'Function',
    name: '--value',
    children: {
      toArray: () => children,
    } as List<CssNode>,
  } as FunctionNode
}

describe('ValueFunction', () => {
  it('has name property returning Value', () => {
    const path = Path.fromDotPath('colors.primary')
    const fn = new ValueFunction(path, null, { start: 0, end: 10 })
    expect(fn.name).toBe(SnowFunctionName.Value)
  })

  it('stores path, modifier, and location', () => {
    const path = Path.fromDotPath('colors.primary')
    const modifier = new AlphaModifier(0.5)
    const location = { start: 5, end: 25 }
    const fn = new ValueFunction(path, modifier, location)
    expect(fn.path).toBe(path)
    expect(fn.modifier).toBe(modifier)
    expect(fn.location).toBe(location)
  })

  describe('toCacheKey', () => {
    it('returns cache key with value prefix', () => {
      const path = Path.fromDotPath('colors.primary')
      const fn = new ValueFunction(path, null, { start: 0, end: 10 })
      const token = Token.from(['colors', 'primary'], '#ff0000')
      const key = fn.toCacheKey(token)
      expect(key).toMatch(/^value:/)
    })

    it('includes modifier in cache key', () => {
      const path = Path.fromDotPath('size.base')
      const token = Token.from(['size', 'base'], '16px')
      const fn1 = new ValueFunction(path, null, { start: 0, end: 10 })
      const fn2 = new ValueFunction(path, new UnitModifier('rem'), { start: 0, end: 10 })
      expect(fn1.toCacheKey(token)).not.toBe(fn2.toCacheKey(token))
    })
  })
})

describe('ValueFunctionParser', () => {
  describe('parse', () => {
    it('parses --value("path") without modifier', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([{ type: 'String', value: 'colors.primary' } as CssNode])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      expect(result?.path.toDotPath()).toBe('colors.primary')
      expect((result as ValueFunction).modifier).toBeNull()
    })

    it('parses --value("path" to px) with unit modifier', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'size.base' } as CssNode,
        { type: 'Identifier', name: 'to' } as CssNode,
        { type: 'Identifier', name: 'px' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      const fn = result as ValueFunction
      expect(fn.modifier).toBeInstanceOf(UnitModifier)
      expect((fn.modifier as UnitModifier).unit).toBe('px')
    })

    it('parses --value("path" to rem) with unit modifier', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'size.base' } as CssNode,
        { type: 'Identifier', name: 'to' } as CssNode,
        { type: 'Identifier', name: 'rem' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      const fn = result as ValueFunction
      expect(fn.modifier).toBeInstanceOf(UnitModifier)
      expect((fn.modifier as UnitModifier).unit).toBe('rem')
    })

    it('parses --value("path" / 50%) with alpha modifier', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'colors.primary' } as CssNode,
        { type: 'Operator', value: '/' } as CssNode,
        { type: 'Percentage', value: '50' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      const fn = result as ValueFunction
      expect(fn.modifier).toBeInstanceOf(AlphaModifier)
      expect((fn.modifier as AlphaModifier).value).toBe(0.5)
    })

    it('returns error for unknown modifier syntax', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'path' } as CssNode,
        { type: 'Identifier', name: 'unknown' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns error for invalid unit (not px/rem)', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'path' } as CssNode,
        { type: 'Identifier', name: 'to' } as CssNode,
        { type: 'Identifier', name: 'em' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns error for non-percentage after /', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'path' } as CssNode,
        { type: 'Operator', value: '/' } as CssNode,
        { type: 'Number', value: '50' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns null for non-string path argument', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([{ type: 'Identifier', name: 'colors' } as CssNode])
      const parser = new ValueFunctionParser(node, { start: 0, end: 20 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('parses --value("path" negate) with negate modifier', () => {
      const diagnostics = new Diagnostics()
      const node = createFunctionNode([
        { type: 'String', value: 'size.4' } as CssNode,
        { type: 'Identifier', name: 'negate' } as CssNode,
      ])
      const parser = new ValueFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(ValueFunction)
      const fn = result as ValueFunction
      expect(fn.modifier).toBeInstanceOf(NegateModifier)
      expect(diagnostics.hasErrors).toBe(false)
    })
  })
})
