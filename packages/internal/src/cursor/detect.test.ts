import { describe, expect, it } from 'vitest'

import { isInsidePath } from './detect'

describe('isInsidePath', () => {
  describe('--token() function', () => {
    it('returns true when cursor is inside quoted path', () => {
      const text = '--token("color.primary")'
      // Cursor after 'color' (offset 14).
      expect(isInsidePath(text, 14)).toBe(true)
    })

    it('returns true when cursor is at start of path', () => {
      const text = '--token("color.primary")'
      // Cursor at 'c' (offset 9).
      expect(isInsidePath(text, 9)).toBe(true)
    })

    it('returns true when cursor is at end of path before quote', () => {
      const text = '--token("color.primary")'
      // Cursor after 'primary' (offset 22).
      expect(isInsidePath(text, 22)).toBe(true)
    })

    it('returns true with single quotes', () => {
      const text = "--token('color.primary')"
      expect(isInsidePath(text, 14)).toBe(true)
    })

    it('returns true when path is empty', () => {
      const text = '--token("")'
      // Cursor between quotes (offset 9).
      expect(isInsidePath(text, 9)).toBe(true)
    })
  })

  describe('--value() function', () => {
    it('returns true when cursor is inside --value path', () => {
      const text = '--value("size.lg")'
      expect(isInsidePath(text, 12)).toBe(true)
    })

    it('returns true for --value with modifiers context', () => {
      const text = 'width: --value("size.lg");'
      expect(isInsidePath(text, 18)).toBe(true)
    })
  })

  describe('whitespace handling', () => {
    it('returns true with space after opening paren', () => {
      const text = '--token( "color.primary")'
      expect(isInsidePath(text, 15)).toBe(true)
    })

    it('returns true with multiple spaces after opening paren', () => {
      const text = '--token(   "color.primary")'
      expect(isInsidePath(text, 17)).toBe(true)
    })

    it('returns true with tab after opening paren', () => {
      const text = '--token(\t"color.primary")'
      expect(isInsidePath(text, 15)).toBe(true)
    })
  })

  describe('negative cases', () => {
    it('returns false when outside function', () => {
      const text = 'color: red; --token("path")'
      // Cursor at 'red' (offset 7).
      expect(isInsidePath(text, 7)).toBe(false)
    })

    it('returns false for non-snow function', () => {
      const text = '--custom("color.primary")'
      expect(isInsidePath(text, 14)).toBe(false)
    })

    it('returns false for regular CSS var()', () => {
      const text = 'var(--color-primary)'
      expect(isInsidePath(text, 10)).toBe(false)
    })

    it('returns false when no opening quote', () => {
      const text = '--token(color.primary)'
      expect(isInsidePath(text, 12)).toBe(false)
    })

    it('returns false when no closing quote on same line', () => {
      const text = '--token("color.primary'
      expect(isInsidePath(text, 14)).toBe(false)
    })

    it('returns false when closing quote is on next line', () => {
      const text = '--token("color.primary\n")'
      expect(isInsidePath(text, 14)).toBe(false)
    })

    it('returns false when no opening paren', () => {
      const text = '--token "color.primary"'
      expect(isInsidePath(text, 14)).toBe(false)
    })

    it('returns false for mismatched quotes', () => {
      // Opening with double quote but closing with single.
      const text = `--token("color.primary')`
      expect(isInsidePath(text, 14)).toBe(false)
    })

    it('returns false at cursor position 0', () => {
      const text = '--token("path")'
      expect(isInsidePath(text, 0)).toBe(false)
    })
  })

  describe('complex scenarios', () => {
    it('works with nested dots in path', () => {
      const text = '--token("color.gray.500")'
      expect(isInsidePath(text, 18)).toBe(true)
    })

    it('works with numeric path segments', () => {
      const text = '--value("size.1.5")'
      expect(isInsidePath(text, 14)).toBe(true)
    })

    it('works with underscores in path', () => {
      const text = '--token("font_size.large")'
      expect(isInsidePath(text, 18)).toBe(true)
    })

    it('works with dashes in path', () => {
      const text = '--token("font-size.large")'
      expect(isInsidePath(text, 18)).toBe(true)
    })

    it('works when function is in middle of CSS declaration', () => {
      const text =
        'background: linear-gradient(to right, --token("color.start"), --token("color.end"));'

      expect(isInsidePath(text, 52)).toBe(true)
      expect(isInsidePath(text, 76)).toBe(true)
    })

    it('handles cursor immediately after opening quote', () => {
      const text = '--token("color")'
      // Position right after opening quote.
      expect(isInsidePath(text, 9)).toBe(true)
    })
  })

  describe('multiline handling', () => {
    it('returns true when closing quote is on same line', () => {
      const text = 'line1\n--token("color.primary")\nline3'
      // Cursor in the path on line 2.
      expect(isInsidePath(text, 18)).toBe(true)
    })

    it('returns false when closing quote would be on different line', () => {
      const text = '--token("color\n.primary")'
      // Cursor before newline.
      expect(isInsidePath(text, 12)).toBe(false)
    })
  })
})
