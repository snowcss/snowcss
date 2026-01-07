import type { CssNode, FunctionNode, List } from 'css-tree'
import { describe, expect, it } from 'vitest'

import { Diagnostics } from '@/diagnostics'
import { Path } from '@/path'
import { Token } from '@/token'

import { SnowFunctionName } from './index'
import { TokenFunction, TokenFunctionParser } from './token'

/** Creates a mock FunctionNode for testing. */
function createFunctionNode(children: Array<CssNode>): FunctionNode {
  return {
    type: 'Function',
    name: '--token',
    children: {
      toArray: () => children,
    } as List<CssNode>,
  } as FunctionNode
}

describe('TokenFunction', () => {
  it('has name property returning Token', () => {
    const path = Path.fromDotPath('colors.primary')
    const fn = new TokenFunction(path, { start: 0, end: 10 })
    expect(fn.name).toBe(SnowFunctionName.Token)
  })

  it('stores path and location', () => {
    const path = Path.fromDotPath('colors.primary')
    const location = { start: 5, end: 25 }
    const fn = new TokenFunction(path, location)
    expect(fn.path).toBe(path)
    expect(fn.location).toBe(location)
  })

  describe('toCacheKey', () => {
    it('returns cache key with token prefix', () => {
      const path = Path.fromDotPath('colors.primary')
      const fn = new TokenFunction(path, { start: 0, end: 10 })
      const token = Token.from(['colors', 'primary'], '#ff0000')
      const key = fn.toCacheKey(token)
      expect(key).toMatch(/^token:/)
    })
  })
})

describe('TokenFunctionParser', () => {
  describe('parse', () => {
    it('parses --token("colors.primary") correctly', () => {
      const node = createFunctionNode([{ type: 'String', value: 'colors.primary' } as CssNode])
      const diagnostics = new Diagnostics()
      const parser = new TokenFunctionParser(node, { start: 0, end: 30 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeInstanceOf(TokenFunction)
      expect(result?.path.toDotPath()).toBe('colors.primary')
    })

    it('extracts path from quoted string argument', () => {
      const node = createFunctionNode([{ type: 'String', value: 'size.0.5' } as CssNode])
      const diagnostics = new Diagnostics()
      const parser = new TokenFunctionParser(node, { start: 0, end: 20 }, diagnostics)
      const result = parser.parse()
      expect(result?.path.segments).toEqual(['size', '0.5'])
    })

    it('returns null and adds error for non-string argument', () => {
      const node = createFunctionNode([{ type: 'Identifier', name: 'colors' } as CssNode])
      const diagnostics = new Diagnostics()
      const parser = new TokenFunctionParser(node, { start: 0, end: 20 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns null and adds error for empty path string', () => {
      const node = createFunctionNode([{ type: 'String', value: '  ' } as CssNode])
      const diagnostics = new Diagnostics()
      const parser = new TokenFunctionParser(node, { start: 0, end: 20 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('returns null and adds error for no arguments', () => {
      const node = createFunctionNode([])
      const diagnostics = new Diagnostics()
      const parser = new TokenFunctionParser(node, { start: 0, end: 10 }, diagnostics)
      const result = parser.parse()
      expect(result).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
    })

    it('sets correct location from source', () => {
      const node = createFunctionNode([{ type: 'String', value: 'path' } as CssNode])
      const diagnostics = new Diagnostics()
      const location = { start: 10, end: 30 }
      const parser = new TokenFunctionParser(node, location, diagnostics)
      const result = parser.parse()
      expect(result?.location).toEqual(location)
    })
  })
})
