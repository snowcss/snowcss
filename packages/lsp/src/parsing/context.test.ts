import { describe, expect, it } from 'vitest'

import { getCursorContext } from './context'

describe('getCursorContext', () => {
  describe('path context', () => {
    it('detects --token path context with double quotes', () => {
      const text = '--token("color.primary")'
      // Cursor after 'color' -> offset 14: --token("color|
      const result = getCursorContext(text, 14)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('token')
        expect(result.prefix).toBe('color')
        expect(result.quote).toBe('"')
      }
    })

    it('detects --value path context with double quotes', () => {
      const text = '--value("size.spacing.4")'
      // Cursor after 'size.spacing' -> offset 21 (after 'g').
      const result = getCursorContext(text, 21)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('value')
        expect(result.prefix).toBe('size.spacing')
        expect(result.quote).toBe('"')
      }
    })

    it('detects path context with single quotes', () => {
      const text = "--token('color.gray.500')"
      // Cursor after 'color.gray' -> offset 19 (after 'y').
      const result = getCursorContext(text, 19)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('token')
        expect(result.prefix).toBe('color.gray')
        expect(result.quote).toBe("'")
      }
    })

    it('handles empty path string', () => {
      const text = '--token("")'
      // Cursor right after opening quote -> offset 9
      const result = getCursorContext(text, 9)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('token')
        expect(result.prefix).toBe('')
        expect(result.prefixStart).toBe(9)
      }
    })

    it('handles cursor at start of path', () => {
      const text = '--value("color")'
      // Cursor right after opening quote -> offset 9
      const result = getCursorContext(text, 9)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('value')
        expect(result.prefix).toBe('')
      }
    })

    it('correctly calculates prefixStart position', () => {
      const text = '--token("color.primary")'
      // Cursor after 'color.prim' -> offset 19 (after 'm').
      const result = getCursorContext(text, 19)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.prefix).toBe('color.prim')
        expect(result.prefixStart).toBe(9) // Position of 'c' in 'color'.
      }
    })

    it('correctly finds pathEnd with closing quote', () => {
      const text = '--token("color.primary")'
      // Cursor after 'color' -> offset 14
      const result = getCursorContext(text, 14)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.pathEnd).toBe(22) // Position of closing quote.
      }
    })

    it('handles whitespace after opening paren', () => {
      const text = '--token(  "color")'
      // Cursor after 'col' -> offset 14
      const result = getCursorContext(text, 14)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('token')
        expect(result.prefix).toBe('col')
      }
    })

    it('handles path with underscores and dashes', () => {
      const text = '--value("font-family_primary")'
      // Cursor at end -> offset 28
      const result = getCursorContext(text, 28)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.prefix).toBe('font-family_primary')
      }
    })
  })

  describe('modifier context', () => {
    it('detects alpha modifier context with slash', () => {
      // Modifier is inside the function call, after the path string.
      const text = '--value("color.red.500" / )'
      // Cursor after slash and space -> offset 25.
      const result = getCursorContext(text, 25)

      expect(result.type).toBe('modifier')
      if (result.type === 'modifier') {
        expect(result.path).toBe('color.red.500')
        expect(result.kind).toBe('alpha')
      }
    })

    it('detects alpha modifier context with partial value', () => {
      const text = '--value("color.blue.600" / 50)'
      // Cursor after '50' -> offset 28.
      const result = getCursorContext(text, 28)

      expect(result.type).toBe('modifier')
      if (result.type === 'modifier') {
        expect(result.path).toBe('color.blue.600')
        expect(result.kind).toBe('alpha')
      }
    })

    it('detects alpha modifier context with percentage', () => {
      const text = '--value("color.green.400" / 75%)'
      // Cursor after '%' -> offset 30.
      const result = getCursorContext(text, 30)

      expect(result.type).toBe('modifier')
      if (result.type === 'modifier') {
        expect(result.path).toBe('color.green.400')
        expect(result.kind).toBe('alpha')
      }
    })

    it('detects modifier context without slash (kind null)', () => {
      const text = '--value("size.4" to )'
      // Cursor after 'to ' -> offset 19.
      const result = getCursorContext(text, 19)

      expect(result.type).toBe('modifier')
      if (result.type === 'modifier') {
        expect(result.path).toBe('size.4')
        expect(result.kind).toBeNull()
      }
    })

    it('does not return modifier context for --token calls', () => {
      const text = '--token("color.red.500" / )'
      // Cursor after slash -> offset 25.
      const result = getCursorContext(text, 25)

      // Should be 'none' since --token doesn't support modifiers.
      expect(result.type).toBe('none')
    })

    it('detects modifier context with single quotes', () => {
      const text = "--value('color.amber.300' / 80)"
      // Cursor after '80' -> offset 29.
      const result = getCursorContext(text, 29)

      expect(result.type).toBe('modifier')
      if (result.type === 'modifier') {
        expect(result.path).toBe('color.amber.300')
        expect(result.kind).toBe('alpha')
      }
    })
  })

  describe('no context', () => {
    it('returns none for regular CSS values', () => {
      const text = 'color: red;'
      const result = getCursorContext(text, 8)

      expect(result.type).toBe('none')
    })

    it('returns none for cursor outside function call', () => {
      const text = 'background: --token("color.primary");'
      // Cursor before --token -> offset 12
      const result = getCursorContext(text, 12)

      expect(result.type).toBe('none')
    })

    it('returns none for missing opening quote', () => {
      const text = '--token(color.primary)'
      // Cursor inside (no quotes) -> offset 15
      const result = getCursorContext(text, 15)

      expect(result.type).toBe('none')
    })

    it('returns none for other function names', () => {
      const text = '--custom("path.value")'
      // Cursor inside -> offset 15
      const result = getCursorContext(text, 15)

      expect(result.type).toBe('none')
    })

    it('returns none for var function', () => {
      const text = 'var(--color-primary)'
      // Cursor inside -> offset 10
      const result = getCursorContext(text, 10)

      expect(result.type).toBe('none')
    })

    it('returns none for empty text', () => {
      const text = ''
      const result = getCursorContext(text, 0)

      expect(result.type).toBe('none')
    })

    it('returns none for cursor at start of text', () => {
      const text = '--token("color")'
      const result = getCursorContext(text, 0)

      expect(result.type).toBe('none')
    })

    it('returns none for unclosed function', () => {
      const text = '--token("color.primary'
      // Cursor inside unclosed string -> offset 18
      // pathEnd should be at offset position since no closing quote found.
      const result = getCursorContext(text, 18)

      // This should still detect path context since we found opening quote.
      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.pathEnd).toBe(18) // No closing quote, so pathEnd equals offset.
      }
    })
  })

  describe('edge cases', () => {
    it('handles multiline CSS with cursor in --token', () => {
      const text = `.class {
  color: --token("color.primary");
}`
      // Find position inside the string.
      const tokenStart = text.indexOf('"') + 1
      const result = getCursorContext(text, tokenStart + 5) // After 'color'.

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('token')
        expect(result.prefix).toBe('color')
      }
    })

    it('handles nested parentheses before function', () => {
      const text = 'calc(100% - --value("size.4"))'
      // Cursor inside --value path.
      const valueStart = text.indexOf('--value("') + 9
      const result = getCursorContext(text, valueStart + 4) // After 'size'.

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.fn).toBe('value')
        expect(result.prefix).toBe('size')
      }
    })

    it('handles numeric path segments', () => {
      const text = '--token("size.1.5")'
      // Cursor at end of path.
      const result = getCursorContext(text, 17)

      expect(result.type).toBe('path')
      if (result.type === 'path') {
        expect(result.prefix).toBe('size.1.5')
      }
    })
  })
})
