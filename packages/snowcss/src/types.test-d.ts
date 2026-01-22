import { describe, expectTypeOf, test } from 'vitest'

import type { GetByPath, SplitPath } from './types'

describe('SplitPath', () => {
  test('basic path splitting', () => {
    expectTypeOf<SplitPath<'colors.primary'>>().toEqualTypeOf<['colors', 'primary']>()
    expectTypeOf<SplitPath<'a.b.c'>>().toEqualTypeOf<['a', 'b', 'c']>()
    expectTypeOf<SplitPath<'font.family'>>().toEqualTypeOf<['font', 'family']>()
  })

  test('consecutive numeric segments kept together', () => {
    expectTypeOf<SplitPath<'spacing.1.5'>>().toEqualTypeOf<['spacing', '1.5']>()
    expectTypeOf<SplitPath<'size.0.5'>>().toEqualTypeOf<['size', '0.5']>()
    expectTypeOf<SplitPath<'opacity.0.75'>>().toEqualTypeOf<['opacity', '0.75']>()
  })

  test('numeric segments separated when non-numeric follows', () => {
    expectTypeOf<SplitPath<'spacing.1.foo'>>().toEqualTypeOf<['spacing', '1', 'foo']>()
    expectTypeOf<SplitPath<'size.2.bar.baz'>>().toEqualTypeOf<['size', '2', 'bar', 'baz']>()
  })

  test('single segment', () => {
    expectTypeOf<SplitPath<'colors'>>().toEqualTypeOf<['colors']>()
    expectTypeOf<SplitPath<'spacing'>>().toEqualTypeOf<['spacing']>()
  })

  test('empty string', () => {
    expectTypeOf<SplitPath<''>>().toEqualTypeOf<[]>()
  })

  test('complex paths with mixed segments', () => {
    expectTypeOf<SplitPath<'theme.colors.primary.500'>>().toEqualTypeOf<
      ['theme', 'colors', 'primary', '500']
    >()
    expectTypeOf<SplitPath<'spacing.1.5.rem'>>().toEqualTypeOf<['spacing', '1.5', 'rem']>()
  })

  test('multiple consecutive numeric pairs', () => {
    expectTypeOf<SplitPath<'a.1.2.3.4'>>().toEqualTypeOf<['a', '1.2', '3.4']>()
    expectTypeOf<SplitPath<'x.0.5.1.0'>>().toEqualTypeOf<['x', '0.5', '1.0']>()
  })
})

describe('GetByPath', () => {
  test('basic nested object access', () => {
    type Config = { colors: { primary: string } }

    expectTypeOf<GetByPath<Config, ['colors']>>().toEqualTypeOf<{ primary: string }>()
    expectTypeOf<GetByPath<Config, ['colors', 'primary']>>().toEqualTypeOf<string>()
  })

  test('non-existent paths return never', () => {
    type Config = { colors: { primary: string } }

    expectTypeOf<GetByPath<Config, ['colors', 'secondary']>>().toEqualTypeOf<never>()
    expectTypeOf<GetByPath<Config, ['spacing']>>().toEqualTypeOf<never>()
    expectTypeOf<GetByPath<Config, ['colors', 'primary', 'invalid']>>().toEqualTypeOf<never>()
  })

  test('deep nesting', () => {
    type Config = {
      theme: {
        colors: {
          primary: {
            500: string
          }
        }
      }
    }

    expectTypeOf<GetByPath<Config, ['theme', 'colors', 'primary', '500']>>().toEqualTypeOf<string>()
    expectTypeOf<GetByPath<Config, ['theme', 'colors']>>().toEqualTypeOf<{
      primary: { 500: string }
    }>()
  })

  test('numeric indices for arrays', () => {
    type Config = {
      items: [string, number, boolean]
    }

    expectTypeOf<GetByPath<Config, ['items', '0']>>().toEqualTypeOf<string>()
    expectTypeOf<GetByPath<Config, ['items', '1']>>().toEqualTypeOf<number>()
    expectTypeOf<GetByPath<Config, ['items', '2']>>().toEqualTypeOf<boolean>()
  })

  test('numeric indices for nested arrays', () => {
    type Config = {
      matrix: Array<Array<number>>
    }

    expectTypeOf<GetByPath<Config, ['matrix', '0']>>().toEqualTypeOf<Array<number>>()
    expectTypeOf<GetByPath<Config, ['matrix', '0', '0']>>().toEqualTypeOf<number>()
  })

  test('empty path returns never', () => {
    type Config = { colors: string }

    expectTypeOf<GetByPath<Config, []>>().toEqualTypeOf<never>()
  })

  test('complex nested structures', () => {
    type Config = {
      spacing: {
        '1.5': '1.5rem'
        '2.5': '2.5rem'
      }
      colors: {
        primary: string
        shades: Array<string>
      }
    }

    expectTypeOf<GetByPath<Config, ['spacing', '1.5']>>().toEqualTypeOf<'1.5rem'>()
    expectTypeOf<GetByPath<Config, ['spacing', '2.5']>>().toEqualTypeOf<'2.5rem'>()
    expectTypeOf<GetByPath<Config, ['colors', 'shades']>>().toEqualTypeOf<Array<string>>()
    expectTypeOf<GetByPath<Config, ['colors', 'shades', '0']>>().toEqualTypeOf<string>()
  })

  test('handles union types', () => {
    type Config = {
      value: string | number
    }

    expectTypeOf<GetByPath<Config, ['value']>>().toEqualTypeOf<string | number>()
  })

  test('handles optional properties', () => {
    type Config = {
      colors?: {
        primary: string
      }
    }

    expectTypeOf<GetByPath<Config, ['colors']>>().toEqualTypeOf<
      | {
          primary: string
        }
      | undefined
    >()
  })
})
