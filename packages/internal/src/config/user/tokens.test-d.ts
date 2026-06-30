import { describe, expectTypeOf, it } from 'vitest'

import { defineTokens } from './tokens'

const tokens = defineTokens({
  colors: {
    primary: '#f00',
    secondary: '#0f0',
  },
  size: {
    '0.5': '8px',
  },
})

describe('defineTokens accessor', () => {
  describe('ref mode', () => {
    it('returns a CSS variable reference for a leaf path', () => {
      expectTypeOf(tokens('colors.primary')).toEqualTypeOf<'var(--colors-primary)'>()
    })

    it('escapes dots in numeric segments', () => {
      expectTypeOf(tokens('size.0.5')).toEqualTypeOf<'var(--size-0\\.5)'>()
    })

    it('rejects a namespace path', () => {
      // @ts-expect-error namespaces cannot be referenced as a CSS variable.
      tokens('colors')
    })
  })

  describe('value mode', () => {
    it('returns the value for a leaf path', () => {
      expectTypeOf(tokens('colors.primary', { as: 'value' })).toExtend<string>()
    })

    it('returns the subtree for a namespace path', () => {
      expectTypeOf(tokens('colors', { as: 'value' })).toExtend<{
        primary: string
        secondary: string
      }>()
    })
  })
})
