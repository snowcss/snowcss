import { describe, expect, it } from 'vitest'

import { escapeCssVarName, stripBoth, stripEnd, stripStart, unescapeCssVarName } from './strings'

describe('escapeCssVarName', () => {
  it('escapes dots in variable names', () => {
    expect(escapeCssVarName('color.primary.500')).toBe('color\\.primary\\.500')
  })

  it('returns unchanged string when no dots present', () => {
    expect(escapeCssVarName('color-primary')).toBe('color-primary')
  })

  it('handles empty string', () => {
    expect(escapeCssVarName('')).toBe('')
  })
})

describe('unescapeCssVarName', () => {
  it('unescapes dots in variable names', () => {
    expect(unescapeCssVarName('color\\.primary\\.500')).toBe('color.primary.500')
  })

  it('returns unchanged string when no escaped dots present', () => {
    expect(unescapeCssVarName('color-primary')).toBe('color-primary')
  })

  it('handles empty string', () => {
    expect(unescapeCssVarName('')).toBe('')
  })
})

describe('stripStart', () => {
  it('strips matching characters from start', () => {
    expect(stripStart('///path/to/file', '/')).toBe('path/to/file')
  })

  it('strips multiple different characters from start', () => {
    expect(stripStart('--__name', '-_')).toBe('name')
  })

  it('returns unchanged string when no matching characters at start', () => {
    expect(stripStart('name--', '-')).toBe('name--')
  })

  it('handles empty string', () => {
    expect(stripStart('', '-')).toBe('')
  })

  it('returns empty string when all characters match', () => {
    expect(stripStart('---', '-')).toBe('')
  })
})

describe('stripEnd', () => {
  it('strips matching characters from end', () => {
    expect(stripEnd('file.txt...', '.')).toBe('file.txt')
  })

  it('strips multiple different characters from end', () => {
    expect(stripEnd('name--__', '-_')).toBe('name')
  })

  it('returns unchanged string when no matching characters at end', () => {
    expect(stripEnd('--name', '-')).toBe('--name')
  })

  it('handles empty string', () => {
    expect(stripEnd('', '-')).toBe('')
  })

  it('returns empty string when all characters match', () => {
    expect(stripEnd('---', '-')).toBe('')
  })
})

describe('stripBoth', () => {
  it('strips matching characters from both ends', () => {
    expect(stripBoth('///path///', '/')).toBe('path')
  })

  it('strips multiple different characters from both ends', () => {
    expect(stripBoth('--__name__--', '-_')).toBe('name')
  })

  it('handles empty string', () => {
    expect(stripBoth('', '-')).toBe('')
  })

  it('returns empty string when all characters match', () => {
    expect(stripBoth('---', '-')).toBe('')
  })
})
