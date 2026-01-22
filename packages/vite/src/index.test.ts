import { join, resolve } from 'node:path'

import type { RollupOutput } from 'rollup'
import type { ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

import {
  SNOWCSS_CLIENT_ID,
  VIRTUAL_CSS_ID,
  VIRTUAL_CSS_ID_RESOLVED,
  VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID_RESOLVED,
} from './constants'
import snowCssPlugin from './index'

const FIXTURES_ASSET_ROOT = resolve(__dirname, '__fixtures__/asset')
const FIXTURES_ASSET_CSS = join(FIXTURES_ASSET_ROOT, 'test.css')
const FIXTURES_ATRULE_ROOT = resolve(__dirname, '__fixtures__/at-rule')
const FIXTURES_ATRULE_CSS = join(FIXTURES_ATRULE_ROOT, 'at-rule.css')
const FIXTURES_ATRULE_TEST_CSS = join(FIXTURES_ATRULE_ROOT, 'test.css')

describe('snowcss plugin', () => {
  let server: ViteDevServer | null = null

  afterEach(async () => {
    if (server) {
      await server.close()
      server = null
    }
  })

  describe('dev server', () => {
    it('resolves virtual module id', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const resolved = await server.pluginContainer.resolveId(VIRTUAL_CSS_ID)

      expect(resolved?.id).toBe(VIRTUAL_CSS_ID_RESOLVED)
    })

    it('resolves virtual JS module id', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const resolved = await server.pluginContainer.resolveId(VIRTUAL_MODULE_ID)

      expect(resolved?.id).toBe(VIRTUAL_MODULE_ID_RESOLVED)
    })

    it('configures snowcss/client alias to virtual module', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      // The alias is configured in the config hook. Vite normalizes aliases to array format.
      const alias = server.config.resolve.alias
      const snowcssAlias = Array.isArray(alias)
        ? alias.find((a) => a.find === SNOWCSS_CLIENT_ID)
        : null

      expect(snowcssAlias).toBeDefined()
    })

    it('loads virtual JS module with runtime functions', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load(VIRTUAL_MODULE_ID_RESOLVED)

      expect(result).toContain('export function value')
      expect(result).toContain('export function token')
      expect(result).toContain('export function tokens')
      expect(result).toContain('export function warmupCache')
      expect(result).toContain('const REGISTRY')
    })

    it('does not include Node.js dependencies in virtual module', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load(VIRTUAL_MODULE_ID_RESOLVED)

      // Virtual module should not import from @snowcss/core (has Node.js deps).
      expect(result).not.toContain('@snowcss/core')
    })

    it('generates REGISTRY with token values', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load(VIRTUAL_MODULE_ID_RESOLVED)

      expect(result).toContain('const REGISTRY')
      expect(result).toContain('"primary":"#ff0000"')
      expect(result).toContain('"secondary":"#00ff00"')
    })

    it('generates nested tokens structure', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load(VIRTUAL_MODULE_ID_RESOLVED)

      // Check for nested structure (color: { primary: '...', secondary: '...' }).
      expect(result).toMatch(/"color":\s*\{/)
      expect(result).toMatch(/"primary":\s*"#ff0000"/)
      expect(result).toMatch(/"secondary":\s*"#00ff00"/)
    })

    it('loads virtual module with all CSS variables', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load(VIRTUAL_CSS_ID_RESOLVED)

      expect(result).toContain('--color-primary')
      expect(result).toContain('--color-secondary')
      expect(result).toContain('--size-4')
    })

    it('transforms CSS with --token() calls', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.transformRequest(FIXTURES_ATRULE_TEST_CSS)

      expect(result?.code).toContain('var(--color-primary)')
    })

    it('transforms CSS with --value() calls', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.transformRequest(FIXTURES_ATRULE_TEST_CSS)

      expect(result?.code).toContain('#00ff00')
      expect(result?.code).toContain('1rem')
    })

    it('transforms CSS with unit modifier', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.transformRequest(FIXTURES_ATRULE_TEST_CSS)

      // size.16 is 16px, converted to rem should be 1rem.
      expect(result?.code).toMatch(/margin:\s*1rem/)
    })

    it('replaces @snowcss at-rule in dev mode', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.transformRequest(FIXTURES_ATRULE_CSS)

      expect(result?.code).not.toContain('@snowcss')
      expect(result?.code).toContain(':root')
      expect(result?.code).toContain('--color-primary')
    })
  })

  describe('build', () => {
    it('emits CSS asset with inject: asset', async () => {
      const output = (await build({
        root: FIXTURES_ASSET_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
        build: {
          write: false,
          rollupOptions: {
            input: FIXTURES_ASSET_CSS,
          },
        },
      })) as RollupOutput

      const assets = output.output.filter((chunk) => chunk.type === 'asset')
      const snowCssAsset = assets.find(
        (a) => a.fileName.endsWith('.css') && a.fileName.includes('snow'),
      )

      expect(snowCssAsset).toBeDefined()

      if (snowCssAsset && snowCssAsset.type === 'asset') {
        expect(snowCssAsset.source).toContain('--color-primary')
      }
    })

    it('replaces @snowcss at-rule in build mode', async () => {
      const output = (await build({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
        build: {
          write: false,
          rollupOptions: {
            input: FIXTURES_ATRULE_CSS,
          },
        },
      })) as RollupOutput

      const cssAssets = output.output.filter(
        (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'),
      )

      // Find the main CSS asset (not snow.css).
      const mainCss = cssAssets.find((a) => !a.fileName.includes('snow'))

      expect(mainCss).toBeDefined()

      if (mainCss && mainCss.type === 'asset') {
        const source = mainCss.source as string
        expect(source).not.toContain('@snowcss')
        expect(source).toContain('--color-primary')
      }
    })

    it('errors when no @snowcss at-rule found with at-rule inject', async () => {
      await expect(
        build({
          root: FIXTURES_ATRULE_ROOT,
          plugins: [snowCssPlugin()],
          logLevel: 'silent',
          build: {
            write: false,
            rollupOptions: {
              // Use test.css which has no @snowcss directive.
              input: FIXTURES_ATRULE_TEST_CSS,
            },
          },
        }),
      ).rejects.toThrow(`no '@snowcss' at-rule was found`)
    })

    it('only emits used tokens in build output', async () => {
      const output = (await build({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
        build: {
          write: false,
          rollupOptions: {
            input: FIXTURES_ATRULE_CSS,
          },
        },
      })) as RollupOutput

      const cssAssets = output.output.filter(
        (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css'),
      )

      const mainCss = cssAssets.find((a) => !a.fileName.includes('snow'))

      if (mainCss && mainCss.type === 'asset') {
        const source = mainCss.source as string

        // at-rule.css only uses color.primary via --token().
        expect(source).toContain('--color-primary')

        // Should not contain unused tokens.
        expect(source).not.toContain('--color-secondary')
        expect(source).not.toContain('--size-4')
      }
    })
  })
})
