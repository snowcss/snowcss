import { describe, expectTypeOf, it } from 'vitest'

import type {
  EscapeCssVarName,
  ExtractPaths,
  ExtractTerminalPaths,
  Flatten,
  GetByPath,
  JoinCssVarPath,
  MaybePromise,
  SplitPath,
  Widen,
} from './types'

declare const sym: unique symbol

describe('Flatten', () => {
  it('merges a union of objects into a single intersection', () => {
    expectTypeOf<Flatten<{ a: string } | { b: number }>>().toEqualTypeOf<{
      a: string
      b: number
    }>()
  })

  it('flattens nested unions', () => {
    expectTypeOf<Flatten<{ a: { x: string } } | { b: number }>>().toEqualTypeOf<{
      a: { x: string }
      b: number
    }>()
  })
})

describe('MaybePromise', () => {
  it('is the value or a promise of the value', () => {
    expectTypeOf<MaybePromise<number>>().toEqualTypeOf<number | Promise<number>>()
    expectTypeOf<MaybePromise<string>>().toEqualTypeOf<string | Promise<string>>()
  })
})

describe('Widen', () => {
  it('widens primitive literals', () => {
    expectTypeOf<Widen<'x'>>().toEqualTypeOf<string>()
    expectTypeOf<Widen<42>>().toEqualTypeOf<number>()
    expectTypeOf<Widen<true>>().toEqualTypeOf<boolean>()
    expectTypeOf<Widen<1n>>().toEqualTypeOf<bigint>()
    expectTypeOf<Widen<undefined>>().toEqualTypeOf<undefined>()
    expectTypeOf<Widen<null>>().toEqualTypeOf<null>()
  })

  it('widens unique symbols to symbol', () => {
    expectTypeOf<Widen<typeof sym>>().toEqualTypeOf<symbol>()
  })

  it('widens object properties recursively', () => {
    expectTypeOf<Widen<{ a: 'x'; b: 42; c: true }>>().toEqualTypeOf<{
      a: string
      b: number
      c: boolean
    }>()
    expectTypeOf<Widen<{ a: { b: 'x' } }>>().toEqualTypeOf<{ a: { b: string } }>()
  })
})

describe('ExtractPaths', () => {
  it('includes both intermediate and leaf paths', () => {
    expectTypeOf<ExtractPaths<{ colors: { primary: string } }>>().toEqualTypeOf<
      'colors' | 'colors.primary'
    >()
  })

  it('returns leaf keys for non-object values', () => {
    expectTypeOf<ExtractPaths<{ a: string; b: number }>>().toEqualTypeOf<'a' | 'b'>()
  })

  it('handles deep nesting', () => {
    expectTypeOf<ExtractPaths<{ a: { b: { c: string } } }>>().toEqualTypeOf<'a' | 'a.b' | 'a.b.c'>()
  })

  it('stringifies numeric keys', () => {
    expectTypeOf<ExtractPaths<{ size: { 0: string } }>>().toEqualTypeOf<'size' | 'size.0'>()
  })
})

describe('ExtractTerminalPaths', () => {
  it('includes only leaf paths', () => {
    expectTypeOf<
      ExtractTerminalPaths<{ colors: { primary: string } }>
    >().toEqualTypeOf<'colors.primary'>()
  })

  it('returns leaf keys for non-object values', () => {
    expectTypeOf<ExtractTerminalPaths<{ a: string; b: number }>>().toEqualTypeOf<'a' | 'b'>()
  })

  it('handles deep nesting without intermediate paths', () => {
    expectTypeOf<ExtractTerminalPaths<{ a: { b: { c: string } } }>>().toEqualTypeOf<'a.b.c'>()
  })

  it('stringifies numeric keys', () => {
    expectTypeOf<ExtractTerminalPaths<{ size: { 0: string } }>>().toEqualTypeOf<'size.0'>()
  })
})

describe('GetByPath', () => {
  it('retrieves nested values', () => {
    type Config = { colors: { primary: string } }

    expectTypeOf<GetByPath<Config, ['colors']>>().toEqualTypeOf<{ primary: string }>()
    expectTypeOf<GetByPath<Config, ['colors', 'primary']>>().toEqualTypeOf<string>()
  })

  it('returns never for non-existent paths', () => {
    type Config = { colors: { primary: string } }

    expectTypeOf<GetByPath<Config, ['colors', 'secondary']>>().toEqualTypeOf<never>()
    expectTypeOf<GetByPath<Config, ['spacing']>>().toEqualTypeOf<never>()
  })

  it('returns never for an empty path', () => {
    expectTypeOf<GetByPath<{ colors: string }, []>>().toEqualTypeOf<never>()
  })

  it('handles deep nesting', () => {
    type Config = { theme: { colors: { primary: { 500: string } } } }

    expectTypeOf<GetByPath<Config, ['theme', 'colors', 'primary', '500']>>().toEqualTypeOf<string>()
  })

  it('supports numeric indices', () => {
    type Config = { items: [string, number, boolean] }

    expectTypeOf<GetByPath<Config, ['items', '0']>>().toEqualTypeOf<string>()
    expectTypeOf<GetByPath<Config, ['items', '1']>>().toEqualTypeOf<number>()
    expectTypeOf<GetByPath<Config, ['items', '2']>>().toEqualTypeOf<boolean>()
  })

  it('preserves optionality', () => {
    type Config = { colors?: { primary: string } }

    expectTypeOf<GetByPath<Config, ['colors']>>().toEqualTypeOf<{ primary: string } | undefined>()
  })
})

describe('SplitPath', () => {
  it('splits a basic dot path', () => {
    expectTypeOf<SplitPath<'colors.primary'>>().toEqualTypeOf<['colors', 'primary']>()
    expectTypeOf<SplitPath<'a.b.c'>>().toEqualTypeOf<['a', 'b', 'c']>()
  })

  it('keeps consecutive numeric segments together', () => {
    expectTypeOf<SplitPath<'spacing.1.5'>>().toEqualTypeOf<['spacing', '1.5']>()
    expectTypeOf<SplitPath<'size.0.5'>>().toEqualTypeOf<['size', '0.5']>()
  })

  it('separates a numeric segment when a non-numeric follows', () => {
    expectTypeOf<SplitPath<'spacing.1.foo'>>().toEqualTypeOf<['spacing', '1', 'foo']>()
  })

  it('handles a single segment', () => {
    expectTypeOf<SplitPath<'colors'>>().toEqualTypeOf<['colors']>()
  })

  it('handles an empty string', () => {
    expectTypeOf<SplitPath<''>>().toEqualTypeOf<[]>()
  })

  it('handles multiple consecutive numeric pairs', () => {
    expectTypeOf<SplitPath<'a.1.2.3.4'>>().toEqualTypeOf<['a', '1.2', '3.4']>()
  })
})

describe('EscapeCssVarName', () => {
  it('escapes dots', () => {
    expectTypeOf<EscapeCssVarName<'colors.primary'>>().toEqualTypeOf<'colors\\.primary'>()
    expectTypeOf<EscapeCssVarName<'a.b.c'>>().toEqualTypeOf<'a\\.b\\.c'>()
  })

  it('leaves dotless strings unchanged', () => {
    expectTypeOf<EscapeCssVarName<'colors-primary'>>().toEqualTypeOf<'colors-primary'>()
    expectTypeOf<EscapeCssVarName<''>>().toEqualTypeOf<''>()
  })
})

describe('JoinCssVarPath', () => {
  it('joins segments with dashes', () => {
    expectTypeOf<JoinCssVarPath<['colors', 'primary']>>().toEqualTypeOf<'colors-primary'>()
    expectTypeOf<
      JoinCssVarPath<['colors', 'primary', '500']>
    >().toEqualTypeOf<'colors-primary-500'>()
  })

  it('escapes dots within segments', () => {
    expectTypeOf<JoinCssVarPath<['size', '0.5']>>().toEqualTypeOf<'size-0\\.5'>()
  })

  it('handles single and empty inputs', () => {
    expectTypeOf<JoinCssVarPath<['colors']>>().toEqualTypeOf<'colors'>()
    expectTypeOf<JoinCssVarPath<[]>>().toEqualTypeOf<''>()
  })
})
