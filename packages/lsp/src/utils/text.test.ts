import { describe, expect, it } from 'vitest'

import type { CssRegion } from '#parsing'

import { findAllFunctions, findFunctionAtOffset, indexToPosition } from './text'

describe('indexToPosition', () => {
  it('returns line 0, character 0 for index 0', () => {
    const result = indexToPosition('hello', 0)

    expect(result.line).toBe(0)
    expect(result.character).toBe(0)
  })

  it('handles single line text', () => {
    const result = indexToPosition('hello world', 6)

    expect(result.line).toBe(0)
    expect(result.character).toBe(6)
  })

  it('handles multiple lines', () => {
    const text = 'line1\nline2\nline3'
    const result = indexToPosition(text, 8)

    expect(result.line).toBe(1)
    expect(result.character).toBe(2)
  })

  it('handles index at newline character', () => {
    const text = 'line1\nline2'
    const result = indexToPosition(text, 5)

    expect(result.line).toBe(0)
    expect(result.character).toBe(5)
  })

  it('handles index right after newline', () => {
    const text = 'line1\nline2'
    const result = indexToPosition(text, 6)

    expect(result.line).toBe(1)
    expect(result.character).toBe(0)
  })

  it('handles index beyond text length', () => {
    const text = 'hi'
    const result = indexToPosition(text, 100)

    expect(result.line).toBe(0)
    expect(result.character).toBe(2)
  })

  it('handles empty string', () => {
    const result = indexToPosition('', 0)

    expect(result.line).toBe(0)
    expect(result.character).toBe(0)
  })

  it('handles multiple consecutive newlines', () => {
    const text = 'a\n\n\nb'
    const result = indexToPosition(text, 4)

    expect(result.line).toBe(3)
    expect(result.character).toBe(0)
  })
})

describe('findAllFunctions', () => {
  it('finds --token() calls in CSS region', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('--token')
    expect(result[0].path).toBe('color.red')
  })

  it('finds --value() calls in CSS region', () => {
    const text = '.foo { width: --value("size.lg"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('--value')
    expect(result[0].path).toBe('size.lg')
  })

  it('finds multiple functions in a single region', () => {
    const text = '.foo { color: --token("color.red"); width: --value("size.lg"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('--token')
    expect(result[1].name).toBe('--value')
  })

  it('finds functions across multiple regions', () => {
    const text = 'PREFIX .a { color: --token("c.a"); } MIDDLE .b { color: --token("c.b"); } SUFFIX'
    const regions: Array<CssRegion> = [
      { start: 7, end: 36 },
      { start: 44, end: 73 },
    ]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('c.a')
    expect(result[1].path).toBe('c.b')
  })

  it('returns empty array for empty regions', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = []

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(0)
  })

  it('returns empty array when no functions in CSS', () => {
    const text = '.foo { color: red; }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(0)
  })

  it('adjusts offsets by region start position', () => {
    const text = 'PREFIX.foo { color: --token("c"); }'
    const regions: Array<CssRegion> = [{ start: 6, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(1)
    // The function starts at position 20 in the region content, plus 6 offset.
    expect(result[0].range.start).toBeGreaterThanOrEqual(6)
  })

  it('handles parse errors gracefully', () => {
    const text = '.foo { color: --token("unclosed }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    // Should not throw, returns empty or partial results.
    const result = findAllFunctions(text, regions)
    expect(Array.isArray(result)).toBe(true)
  })

  it('extracts modifier from --value() calls', () => {
    const text = '.foo { color: --value("color.red" / 50%); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(1)
    expect(result[0].modifier).not.toBeNull()
  })

  it('returns null modifier for --token() calls', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findAllFunctions(text, regions)

    expect(result).toHaveLength(1)
    expect(result[0].modifier).toBeNull()
  })
})

describe('findFunctionAtOffset', () => {
  it('returns function when offset is inside function range', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findFunctionAtOffset(text, 20, regions)

    expect(result).not.toBeNull()
    expect(result?.name).toBe('--token')
  })

  it('returns function at start boundary', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]
    const functions = findAllFunctions(text, regions)
    const fnStart = functions[0].range.start

    const result = findFunctionAtOffset(text, fnStart, regions)

    expect(result).not.toBeNull()
    expect(result?.name).toBe('--token')
  })

  it('returns function at end boundary', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]
    const functions = findAllFunctions(text, regions)
    const fnEnd = functions[0].range.end

    const result = findFunctionAtOffset(text, fnEnd, regions)

    expect(result).not.toBeNull()
    expect(result?.name).toBe('--token')
  })

  it('returns null when offset is outside CSS regions', () => {
    const text = 'PREFIX .foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = [{ start: 7, end: text.length }]

    const result = findFunctionAtOffset(text, 3, regions)

    expect(result).toBeNull()
  })

  it('returns null when offset is between functions', () => {
    const text = '.foo { color: --token("a"); } .bar { color: --token("b"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    // Offset in the space between the two rules.
    const result = findFunctionAtOffset(text, 30, regions)

    expect(result).toBeNull()
  })

  it('returns null for empty regions', () => {
    const text = '.foo { color: --token("color.red"); }'
    const regions: Array<CssRegion> = []

    const result = findFunctionAtOffset(text, 20, regions)

    expect(result).toBeNull()
  })

  it('returns null when no functions in CSS', () => {
    const text = '.foo { color: red; }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]

    const result = findFunctionAtOffset(text, 10, regions)

    expect(result).toBeNull()
  })

  it('returns correct function when multiple functions exist', () => {
    const text = '.foo { color: --token("a"); width: --value("b"); }'
    const regions: Array<CssRegion> = [{ start: 0, end: text.length }]
    const functions = findAllFunctions(text, regions)
    const secondFnStart = functions[1].range.start

    const result = findFunctionAtOffset(text, secondFnStart + 5, regions)

    expect(result).not.toBeNull()
    expect(result?.name).toBe('--value')
    expect(result?.path).toBe('b')
  })
})
