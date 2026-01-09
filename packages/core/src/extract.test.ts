import { describe, expect, it } from 'vitest'

import { extract } from './extract'
import { TokenFunction, ValueFunction } from './functions'

describe('extract', () => {
  it('extracts single --token() call from CSS property value', () => {
    const css = '.test { color: --token("colors.primary"); }'
    const [functions, diagnostics] = extract(css)
    expect(functions).toHaveLength(1)
    expect(functions[0]).toBeInstanceOf(TokenFunction)
    expect(functions[0].path.toDotPath()).toBe('colors.primary')
    expect(diagnostics.hasErrors).toBe(false)
  })

  it('extracts single --value() call from CSS property value', () => {
    const css = '.test { font-size: --value("size.base"); }'
    const [functions, diagnostics] = extract(css)
    expect(functions).toHaveLength(1)
    expect(functions[0]).toBeInstanceOf(ValueFunction)
    expect(functions[0].path.toDotPath()).toBe('size.base')
    expect(diagnostics.hasErrors).toBe(false)
  })

  it('extracts multiple function calls from the same rule', () => {
    const css = '.test { padding: --value("spacing.sm") --value("spacing.md"); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(2)
    expect(functions[0].path.toDotPath()).toBe('spacing.sm')
    expect(functions[1].path.toDotPath()).toBe('spacing.md')
  })

  it('extracts functions from different CSS rules', () => {
    const css = `
      .a { color: --token("colors.primary"); }
      .b { color: --token("colors.secondary"); }
    `
    const [functions] = extract(css)
    expect(functions).toHaveLength(2)
  })

  it('returns correct location (start/end offsets) for each function', () => {
    const css = '.test { color: --token("path"); }'
    const [functions] = extract(css)
    expect(functions[0].location.start).toBeGreaterThan(0)
    expect(functions[0].location.end).toBeGreaterThan(functions[0].location.start)
  })

  it('ignores non-Snow CSS functions', () => {
    const css = '.test { color: var(--primary); width: calc(100% - 20px); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(0)
  })

  it('handles nested CSS (media queries)', () => {
    const css = '@media (min-width: 768px) { .test { color: --token("colors.primary"); } }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(1)
    expect(functions[0].path.toDotPath()).toBe('colors.primary')
  })

  it('returns empty array for CSS with no Snow functions', () => {
    const css = '.test { color: red; font-size: 16px; }'
    const [functions, diagnostics] = extract(css)
    expect(functions).toHaveLength(0)
    expect(diagnostics.hasErrors).toBe(false)
  })

  it('extracts --value() with unit modifier', () => {
    const css = '.test { font-size: --value("size.base" to rem); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(1)
    const fn = functions[0] as ValueFunction
    expect(fn.modifier).not.toBeNull()
  })

  it('extracts --value() with alpha modifier', () => {
    const css = '.test { color: --value("colors.primary" / 50%); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(1)
    const fn = functions[0] as ValueFunction
    expect(fn.modifier).not.toBeNull()
  })

  it('handles path with decimal segment like size.0.5', () => {
    const css = '.test { gap: --token("size.0.5"); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(1)
    expect(functions[0].path.segments).toEqual(['size', '0.5'])
  })

  it('extracts --value() with negate modifier', () => {
    const css = '.test { margin-top: --value("size.4" negate); }'
    const [functions] = extract(css)
    expect(functions).toHaveLength(1)
    const fn = functions[0] as ValueFunction
    expect(fn.modifier).not.toBeNull()
  })

  describe('negative scenarios', () => {
    it('returns empty array for empty input', () => {
      const [functions, diagnostics] = extract('')
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('returns empty array for whitespace-only input', () => {
      const [functions, diagnostics] = extract('   \n\t  ')
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('emits diagnostic when --token() has no arguments', () => {
      const css = '.test { color: --token(); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('expected a quoted string path')
    })

    it('emits diagnostic when --value() has no arguments', () => {
      const css = '.test { font-size: --value(); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('expected a quoted string path')
    })

    it('emits diagnostic when path is empty string', () => {
      const css = '.test { color: --token(""); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('empty path is not allowed')
    })

    it('emits diagnostic when path is whitespace-only', () => {
      const css = '.test { color: --token("   "); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('empty path is not allowed')
    })

    it('emits diagnostic when path argument is an identifier', () => {
      const css = '.test { color: --token(primary); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('expected a quoted string path')
    })

    it('emits diagnostic when path argument is a number', () => {
      const css = '.test { color: --token(42); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(0)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('expected a quoted string path')
    })

    it('emits diagnostic for unknown modifier', () => {
      const css = '.test { font-size: --value("size.base" * 2); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      const fn = functions[0] as ValueFunction
      expect(fn.modifier).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain('unexpected --value() modifier')
    })

    it('emits diagnostic when unit is missing', () => {
      const css = '.test { font-size: --value("size.base" to); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      const fn = functions[0] as ValueFunction
      expect(fn.modifier).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain("expected unit identifier after 'to'")
    })

    it('emits diagnostic for unsupported unit', () => {
      const css = '.test { font-size: --value("size.base" to em); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      const fn = functions[0] as ValueFunction
      expect(fn.modifier).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain("unexpected unit 'em'")
    })

    it('emits diagnostic when percentage is missing', () => {
      const css = '.test { color: --value("colors.primary" /); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      const fn = functions[0] as ValueFunction
      expect(fn.modifier).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain("expected percentage value after '/'")
    })

    it('emits diagnostic for non-percentage alpha', () => {
      const css = '.test { color: --value("colors.primary" / 0.5); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      const fn = functions[0] as ValueFunction
      expect(fn.modifier).toBeNull()
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors[0].message).toContain("expected percentage value after '/'")
    })

    it('extracts valid functions and emits diagnostics for invalid ones', () => {
      const css = `
        .a { color: --token("colors.valid"); }
        .b { color: --token(); }
        .c { font-size: --value("size.base"); }
      `
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(2)
      expect(functions[0].path.toDotPath()).toBe('colors.valid')
      expect(functions[1].path.toDotPath()).toBe('size.base')
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors).toHaveLength(1)
    })

    it('collects multiple diagnostics for multiple invalid functions', () => {
      const css = `
        .a { color: --token(); }
        .b { color: --token(""); }
        .c { font-size: --value("size" to em); }
      `
      const [functions, diagnostics] = extract(css)
      // Third function is extracted but with null modifier.
      expect(functions).toHaveLength(1)
      expect(diagnostics.hasErrors).toBe(true)
      expect(diagnostics.errors).toHaveLength(3)
    })
  })

  describe('custom property values', () => {
    it('extracts --token() from custom property value', () => {
      const css = '.app { --border: 1px solid --token("colors.gray.700"); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      expect(functions[0]).toBeInstanceOf(TokenFunction)
      expect(functions[0].path.toDotPath()).toBe('colors.gray.700')
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('extracts --value() from custom property value', () => {
      const css = '.app { --size: --value("spacing.4"); }'
      const [functions, diagnostics] = extract(css)
      expect(functions).toHaveLength(1)
      expect(functions[0]).toBeInstanceOf(ValueFunction)
      expect(functions[0].path.toDotPath()).toBe('spacing.4')
      expect(diagnostics.hasErrors).toBe(false)
    })

    it('extracts multiple functions from custom property value', () => {
      const css =
        '.app { --gradient: linear-gradient(--token("colors.red.500"), --token("colors.blue.500")); }'
      const [functions] = extract(css)
      expect(functions).toHaveLength(2)
      expect(functions[0].path.toDotPath()).toBe('colors.red.500')
      expect(functions[1].path.toDotPath()).toBe('colors.blue.500')
    })

    it('returns correct location offsets for functions in custom property values', () => {
      const css = '.app { --border: 1px solid --token("colors.gray.700"); }'
      const [functions] = extract(css)
      const fn = functions[0]
      // Verify the location points to the correct substring.
      expect(css.substring(fn.location.start, fn.location.end)).toBe('--token("colors.gray.700")')
    })
  })
})
