import { describe, expect, it } from 'vitest'

import { Path } from '@/path'
import { Token } from '@/token'

import { Config } from './config'
import { defineConfig } from './user'

describe('Config', () => {
  describe('create', () => {
    it('creates config from user config', async () => {
      const userConfig = await defineConfig({
        tokens: {
          colors: { primary: '#ff0000' },
        },
      })
      const config = Config.create(userConfig, '/test/path')
      expect(config.config.tokens.colors.primary).toBe('#ff0000')
    })

    it('builds token index from nested tokens object', async () => {
      const userConfig = await defineConfig({
        tokens: {
          colors: {
            primary: '#ff0000',
            secondary: '#00ff00',
          },
          size: {
            base: '16px',
          },
        },
      })
      const config = Config.create(userConfig, '/test/path')
      expect(config.tokens).toHaveLength(3)
    })

    it('applies prefix to token paths when configured', async () => {
      const userConfig = await defineConfig({
        prefix: 'app',
        tokens: {
          colors: { primary: '#ff0000' },
        },
      })
      const config = Config.create(userConfig, '/test/path')
      const token = config.getByPath(Path.fromDotPath('colors.primary'))
      expect(token?.path.segments).toEqual(['app', 'colors', 'primary'])
    })
  })

  describe('getByPath', () => {
    it('returns token for existing path', async () => {
      const userConfig = await defineConfig({
        tokens: {
          colors: { primary: '#ff0000' },
        },
      })
      const config = Config.create(userConfig, '/test/path')
      const token = config.getByPath(Path.fromDotPath('colors.primary'))
      expect(token).toBeInstanceOf(Token)
      expect(token?.raw).toBe('#ff0000')
    })

    it('returns null for non-existent path', async () => {
      const userConfig = await defineConfig({
        tokens: {
          colors: { primary: '#ff0000' },
        },
      })
      const config = Config.create(userConfig, '/test/path')
      const token = config.getByPath(Path.fromDotPath('colors.secondary'))
      expect(token).toBeNull()
    })
  })

  describe('tokens getter', () => {
    it('returns all tokens as array', async () => {
      const userConfig = await defineConfig({
        tokens: {
          a: '1',
          b: '2',
          c: '3',
        },
      })
      const config = Config.create(userConfig, '/test/path')
      expect(config.tokens).toHaveLength(3)
      expect(config.tokens.every((t) => t instanceof Token)).toBe(true)
    })
  })
})
