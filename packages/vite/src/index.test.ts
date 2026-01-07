import { join, resolve } from 'node:path'

import type { RollupOutput } from 'rollup'
import type { ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'

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

      const resolved = await server.pluginContainer.resolveId('virtual:snowcss/tokens.css')

      expect(resolved?.id).toBe('\0virtual:snowcss/tokens.css')
    })

    it('loads virtual module with all CSS variables', async () => {
      server = await createServer({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
      })

      const result = await server.pluginContainer.load('\0virtual:snowcss/tokens.css')

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

    it('warns when no @snowcss directive found with at-rule inject', async () => {
      const warnings: Array<string> = []

      await build({
        root: FIXTURES_ATRULE_ROOT,
        plugins: [snowCssPlugin()],
        logLevel: 'silent',
        build: {
          write: false,
          rollupOptions: {
            // Use test.css which has no @snowcss directive.
            input: FIXTURES_ATRULE_TEST_CSS,
            onwarn(warning) {
              warnings.push(typeof warning === 'string' ? warning : warning.message)
            },
          },
        },
      })

      expect(warnings.some((w) => w.includes(`no '@snowcss;' directive was found`))).toBe(true)
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
