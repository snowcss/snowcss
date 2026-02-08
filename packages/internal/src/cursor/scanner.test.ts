import { describe, expect, it } from 'vitest'

import { BackwardScanner, isDigit, isIdentChar, isQuote, isWhitespace } from './scanner'

describe('BackwardScanner', () => {
  describe('hasMore', () => {
    it('returns true when position is valid', () => {
      const scanner = new BackwardScanner('abc', 2)
      expect(scanner.hasMore()).toBe(true)
    })

    it('returns true at position 0', () => {
      const scanner = new BackwardScanner('abc', 0)
      expect(scanner.hasMore()).toBe(true)
    })

    it('returns false when position is negative', () => {
      const scanner = new BackwardScanner('abc', -1)
      expect(scanner.hasMore()).toBe(false)
    })
  })

  describe('peek', () => {
    it('returns character at current position', () => {
      const scanner = new BackwardScanner('abc', 1)
      expect(scanner.peek()).toBe('b')
    })

    it('returns first character at position 0', () => {
      const scanner = new BackwardScanner('abc', 0)
      expect(scanner.peek()).toBe('a')
    })

    it('returns last character at end position', () => {
      const scanner = new BackwardScanner('abc', 2)
      expect(scanner.peek()).toBe('c')
    })

    it('returns empty string for invalid position', () => {
      const scanner = new BackwardScanner('abc', -1)
      expect(scanner.peek()).toBe('')
    })

    it('does not advance position', () => {
      const scanner = new BackwardScanner('abc', 2)
      scanner.peek()
      scanner.peek()
      expect(scanner.pos).toBe(2)
    })
  })

  describe('advance', () => {
    it('returns current character and moves backward', () => {
      const scanner = new BackwardScanner('abc', 2)
      expect(scanner.advance()).toBe('c')
      expect(scanner.pos).toBe(1)
    })

    it('advances through entire string backward', () => {
      const scanner = new BackwardScanner('abc', 2)
      expect(scanner.advance()).toBe('c')
      expect(scanner.advance()).toBe('b')
      expect(scanner.advance()).toBe('a')
      expect(scanner.hasMore()).toBe(false)
    })

    it('returns empty string when past beginning', () => {
      const scanner = new BackwardScanner('abc', -1)
      expect(scanner.advance()).toBe('')
    })
  })

  describe('skipWhitespace', () => {
    it('skips spaces backward', () => {
      const scanner = new BackwardScanner('abc   ', 5)
      scanner.skipWhitespace()
      expect(scanner.peek()).toBe('c')
    })

    it('skips tabs and newlines', () => {
      const scanner = new BackwardScanner('abc\t\n\r ', 6)
      scanner.skipWhitespace()
      expect(scanner.peek()).toBe('c')
    })

    it('does nothing when no whitespace', () => {
      const scanner = new BackwardScanner('abc', 2)
      scanner.skipWhitespace()
      expect(scanner.peek()).toBe('c')
    })

    it('handles all whitespace string', () => {
      const scanner = new BackwardScanner('   ', 2)
      scanner.skipWhitespace()
      expect(scanner.hasMore()).toBe(false)
    })
  })

  describe('collectUntil', () => {
    it('collects characters until target', () => {
      const scanner = new BackwardScanner('abc(def)', 6)
      const result = scanner.collectUntil('(')
      expect(result).toBe('def')
      expect(scanner.peek()).toBe('(')
    })

    it('returns empty string when at target', () => {
      const scanner = new BackwardScanner('abc(', 3)
      const result = scanner.collectUntil('(')
      expect(result).toBe('')
    })

    it('collects entire string if target not found', () => {
      const scanner = new BackwardScanner('abcdef', 5)
      const result = scanner.collectUntil('x')
      expect(result).toBe('abcdef')
      expect(scanner.hasMore()).toBe(false)
    })
  })

  describe('collectWhile', () => {
    it('collects characters while predicate is true', () => {
      const scanner = new BackwardScanner('abc123', 5)
      const result = scanner.collectWhile(isDigit)
      expect(result).toBe('123')
      expect(scanner.peek()).toBe('c')
    })

    it('returns empty string when predicate immediately false', () => {
      const scanner = new BackwardScanner('abc123', 2)
      const result = scanner.collectWhile(isDigit)
      expect(result).toBe('')
      expect(scanner.peek()).toBe('c')
    })

    it('collects entire string if predicate always true', () => {
      const scanner = new BackwardScanner('12345', 4)
      const result = scanner.collectWhile(isDigit)
      expect(result).toBe('12345')
      expect(scanner.hasMore()).toBe(false)
    })
  })

  describe('matches', () => {
    it('returns true when text matches', () => {
      const scanner = new BackwardScanner('--token', 6)
      expect(scanner.matches('--token')).toBe(true)
    })

    it('returns false when text does not match', () => {
      const scanner = new BackwardScanner('--value', 6)
      expect(scanner.matches('--token')).toBe(false)
    })

    it('returns false when expected string is too long', () => {
      const scanner = new BackwardScanner('abc', 2)
      expect(scanner.matches('abcdef')).toBe(false)
    })

    it('matches at middle of string', () => {
      const scanner = new BackwardScanner('foo--tokenbar', 9)
      expect(scanner.matches('--token')).toBe(true)
    })

    it('returns true for single character match', () => {
      const scanner = new BackwardScanner('abc', 1)
      expect(scanner.matches('b')).toBe(true)
    })
  })

  describe('skip', () => {
    it('skips expected string and returns true', () => {
      const scanner = new BackwardScanner('--token', 6)
      expect(scanner.skip('--token')).toBe(true)
      expect(scanner.hasMore()).toBe(false)
    })

    it('returns false and does not skip when no match', () => {
      const scanner = new BackwardScanner('--value', 6)
      expect(scanner.skip('--token')).toBe(false)
      expect(scanner.pos).toBe(6)
    })

    it('positions after skip correctly', () => {
      const scanner = new BackwardScanner('foo--token', 9)
      expect(scanner.skip('--token')).toBe(true)
      expect(scanner.peek()).toBe('o')
    })
  })
})

describe('isWhitespace', () => {
  it('returns true for space', () => {
    expect(isWhitespace(' ')).toBe(true)
  })

  it('returns true for tab', () => {
    expect(isWhitespace('\t')).toBe(true)
  })

  it('returns true for newline', () => {
    expect(isWhitespace('\n')).toBe(true)
  })

  it('returns true for carriage return', () => {
    expect(isWhitespace('\r')).toBe(true)
  })

  it('returns false for non-whitespace', () => {
    expect(isWhitespace('a')).toBe(false)
    expect(isWhitespace('1')).toBe(false)
    expect(isWhitespace('-')).toBe(false)
  })
})

describe('isQuote', () => {
  it('returns true for double quote', () => {
    expect(isQuote('"')).toBe(true)
  })

  it('returns true for single quote', () => {
    expect(isQuote("'")).toBe(true)
  })

  it('returns false for backtick', () => {
    expect(isQuote('`')).toBe(false)
  })

  it('returns false for non-quotes', () => {
    expect(isQuote('a')).toBe(false)
    expect(isQuote(' ')).toBe(false)
  })
})

describe('isDigit', () => {
  it('returns true for digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(isDigit(String(i))).toBe(true)
    }
  })

  it('returns false for letters', () => {
    expect(isDigit('a')).toBe(false)
    expect(isDigit('Z')).toBe(false)
  })

  it('returns false for special characters', () => {
    expect(isDigit('-')).toBe(false)
    expect(isDigit('.')).toBe(false)
  })
})

describe('isIdentChar', () => {
  it('returns true for lowercase letters', () => {
    expect(isIdentChar('a')).toBe(true)
    expect(isIdentChar('z')).toBe(true)
  })

  it('returns true for uppercase letters', () => {
    expect(isIdentChar('A')).toBe(true)
    expect(isIdentChar('Z')).toBe(true)
  })

  it('returns true for digits', () => {
    expect(isIdentChar('0')).toBe(true)
    expect(isIdentChar('9')).toBe(true)
  })

  it('returns true for underscore', () => {
    expect(isIdentChar('_')).toBe(true)
  })

  it('returns true for dash', () => {
    expect(isIdentChar('-')).toBe(true)
  })

  it('returns true for dot', () => {
    expect(isIdentChar('.')).toBe(true)
  })

  it('returns false for quotes', () => {
    expect(isIdentChar('"')).toBe(false)
    expect(isIdentChar("'")).toBe(false)
  })

  it('returns false for whitespace', () => {
    expect(isIdentChar(' ')).toBe(false)
    expect(isIdentChar('\t')).toBe(false)
  })

  it('returns false for parentheses', () => {
    expect(isIdentChar('(')).toBe(false)
    expect(isIdentChar(')')).toBe(false)
  })
})
