import type { Diagnostics } from '@snowcss/internal'
import type { PluginContext, TransformPluginContext } from 'rollup'
import type { HtmlTagDescriptor, Plugin } from 'vite'

import { generateVirtualModule, writeTypesFile } from './codegen'
import {
  SNOWCSS_CLIENT_ID,
  VIRTUAL_CSS_ID,
  VIRTUAL_CSS_ID_RESOLVED,
  VIRTUAL_CSS_PLACEHOLDER,
  VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID_RESOLVED,
} from './constants'
import { Context } from './context'
import { serveVirtualCss } from './middlewares'

interface SnowPluginOptions {
  /**
   * Path to the Snow CSS config file. If not specified, the plugin will look for a
   * 'snowcss.config.ts' file in directory with the Vite config.
   */
  config?: string
  /**
   * List of tokens or token namespaces to include in the runtime bundle.
   *
   * - If not specified or empty, all tokens from the config will be included.
   * - When specifying token namespaces, wildcards are supported.
   * - It's possible to specify RegExp patterns.
   *
   * @example
   *
   * // Include concrete tokens
   * ['color.gray.100', 'color.gray.200']
   *
   * // Include all tokens in the 'color.accent' and 'size' namespaces
   * ['color.accent.*', 'size.*']
   *
   * // Include all tokens that match the RegExp
   * [/^color\./]
   *
   * @default []
   */
  runtimeTokens?: Array<string | RegExp>
}

export default function snowCssPlugin(options: SnowPluginOptions = {}): Plugin {
  let snowContext: Context

  let isBuild: boolean = false
  let virtualCssImported: boolean = false
  let assetFileId: string | null = null
  let assetSource: string | null = null
  let atRuleFileId: string | null = null

  function createInlineStyle(css: string): HtmlTagDescriptor {
    return {
      tag: 'style',
      injectTo: 'head',
      attrs: {
        type: 'text/css',
      },
      children: css,
    }
  }

  function createAssetLink(href: string): HtmlTagDescriptor {
    return {
      tag: 'link',
      injectTo: 'head',
      attrs: {
        rel: 'stylesheet',
        href,
      },
    }
  }

  function getIndexTag(): HtmlTagDescriptor | null {
    // When virtual CSS is imported directly, the framework handles CSS delivery.
    if (virtualCssImported) {
      return null
    }

    const inject = snowContext.config.config.inject

    if (inject === 'inline') {
      // If building and there is an asset source (generated from only used tokens/functions).
      if (isBuild && assetSource) {
        return createInlineStyle(assetSource)
      }

      // If serving (dev mode), inline all CSS vars.
      if (!isBuild) {
        const css = snowContext.emitAllCss({
          minify: false,
        })

        if (css) {
          return createInlineStyle(css)
        }
      }
    }

    if (inject === 'asset') {
      // If building and there is an asset file id (generated from only used tokens/functions).
      if (isBuild && assetFileId) {
        return createAssetLink(assetFileId)
      }

      // If serving (dev mode), link to virtual module.
      if (!isBuild) {
        return createAssetLink('/' + VIRTUAL_CSS_ID)
      }
    }

    return null
  }

  function emitDiagnostics(
    ctx: TransformPluginContext | PluginContext,
    diagnostics: Diagnostics,
  ): void {
    if (diagnostics.size) {
      for (const diagnostic of diagnostics) {
        if (diagnostic.severity === 'error') ctx.error(diagnostic.message)
        if (diagnostic.severity === 'warning') ctx.warn(diagnostic.message)
        if (diagnostic.severity === 'info') ctx.info(diagnostic.message)
      }
    }
  }

  return {
    name: 'vite-plugin-snowcss',
    enforce: 'pre',

    async config({ root = process.cwd() }) {
      try {
        snowContext = await Context.create({
          root,
          path: options.config,
        })

        // Generate TypeScript definitions for the virtual module.
        writeTypesFile(snowContext.config, root)
      } catch (error) {
        if (error instanceof Error) {
          this.error('failed to load snowcss config')
        }
      }

      // Alias 'snowcss/client' to the virtual module.
      return {
        resolve: {
          alias: {
            [SNOWCSS_CLIENT_ID]: VIRTUAL_MODULE_ID,
          },
        },
      }
    },

    configResolved({ command }) {
      isBuild = command === 'build'
    },

    configureServer(server) {
      // Watch for snow config changes.
      server.watcher.add(snowContext.config.path).on('change', (file) => {
        if (file === snowContext.config.path) {
          // Regenerate TypeScript definitions on config change.
          writeTypesFile(snowContext.config, server.config.root)
          server.restart()
        }
      })

      // Serve virtual CSS at /virtual:snowcss.css.
      server.middlewares.use(serveVirtualCss(snowContext))
    },

    resolveId(id) {
      // Resolve 'virtual:snowcss' imports.
      if (id === VIRTUAL_MODULE_ID) {
        return VIRTUAL_MODULE_ID_RESOLVED
      }

      // Resolve 'virtual:snowcss.css' imports, plus the resolved id itself when Vite's dev
      // server forwards a browser request for the generated URL back through resolveId.
      // Preserve the '?inline' query so Vite's CSS plugin emits the CSS string as the
      // module's default export (required by SvelteKit's SSR inline-styles path).
      if (id === VIRTUAL_CSS_ID + '?inline' || id === VIRTUAL_CSS_ID_RESOLVED + '?inline') {
        virtualCssImported = true
        return VIRTUAL_CSS_ID_RESOLVED + '?inline'
      }

      if (id === VIRTUAL_CSS_ID || id === VIRTUAL_CSS_ID_RESOLVED) {
        virtualCssImported = true
        return VIRTUAL_CSS_ID_RESOLVED
      }
    },

    load(id) {
      const baseId = id.endsWith('?inline') ? id.slice(0, -'?inline'.length) : id

      if (baseId === VIRTUAL_CSS_ID_RESOLVED) {
        // In build mode, emit only the placeholder. `generateBundle` will replace it with
        // tree-shaken declarations once Vite has walked the actual CSS usage.
        if (isBuild) {
          return VIRTUAL_CSS_PLACEHOLDER
        }

        // In dev mode, serve all tokens so HMR and arbitrary token usage work.
        return snowContext.emitAllCss({ minify: false }) ?? ''
      }

      if (id === VIRTUAL_MODULE_ID_RESOLVED) {
        return generateVirtualModule(snowContext, options.runtimeTokens)
      }
    },

    transform(code, id) {
      if (!id.includes('node_modules') && id.endsWith('.css')) {
        const inject = snowContext.config.config.inject
        const [resolved, diagnostics] = snowContext.collect(code)

        emitDiagnostics(this, diagnostics)

        // Short-circuit the transform if there are any error diagnostics.
        if (diagnostics.hasErrors) {
          return null
        }

        // Replace --token()/--value() functions.
        let result = snowContext.replace(code, resolved)

        // Handle at-rule injection in dev mode. In build mode, this is deferred to generateBundle
        // so we can emit only used tokens.
        if (inject === 'at-rule' && !isBuild) {
          const isAtRuleFile = atRuleFileId === null || atRuleFileId === id

          if (isAtRuleFile) {
            const [atRules, diagnostics] = snowContext.collectAtRule(result)

            emitDiagnostics(this, diagnostics)

            if (atRules.length > 0) {
              atRuleFileId = id

              if (atRules.length > 1) {
                this.warn(
                  `found ${atRules.length} '@snowcss' at-rules, only the first one will be used`,
                )
              }

              const css = snowContext.emitAllCss({
                minify: false,
              })

              result = snowContext.replaceAtRule(result, atRules[0], css ?? '')
            }
          }
        }

        return result
      }

      return null
    },

    // This hook only works in build mode, so here we emit used CSS variables.
    generateBundle(_, bundle) {
      const inject = snowContext.config.config.inject

      const emitted = snowContext.emitCss({
        minify: true,
      })

      // When virtual CSS is imported, replace the placeholder in the bundle's CSS/HTML assets with
      // tree-shaken declarations. Skip separate asset/inline emission since the CSS is already
      // part of the bundle via Vite's CSS pipeline.
      if (virtualCssImported) {
        for (const asset of Object.values(bundle)) {
          if (
            asset.type === 'asset' &&
            typeof asset.source === 'string' &&
            asset.source.includes(VIRTUAL_CSS_PLACEHOLDER) &&
            (asset.fileName.endsWith('.css') || asset.fileName.endsWith('.html'))
          ) {
            asset.source = asset.source.replace(VIRTUAL_CSS_PLACEHOLDER, emitted ?? '')
          }
        }

        return
      }

      if (!emitted) {
        return
      }

      if (inject === 'asset') {
        const file = this.emitFile({
          type: 'asset',
          name: 'snow.css',
          source: emitted,
        })

        assetFileId = this.getFileName(file)
      }

      if (inject === 'inline') {
        assetSource = emitted
      }

      if (inject === 'at-rule') {
        let atRuleFound = false

        for (const [fileName, asset] of Object.entries(bundle)) {
          if (asset.type === 'asset' && fileName.endsWith('.css')) {
            const content = typeof asset.source === 'string' ? asset.source : ''
            const [atRules, diagnostics] = snowContext.collectAtRule(content)

            emitDiagnostics(this, diagnostics)

            if (atRules.length > 0) {
              if (atRules.length > 1) {
                this.warn(
                  `found ${atRules.length} '@snowcss' at-rules, only the first one will be used`,
                )
              }

              asset.source = snowContext.replaceAtRule(content, atRules[0], emitted)
              atRuleFound = true
            }
          }
        }

        if (!atRuleFound) {
          this.error(`inject is set to 'at-rule', but no '@snowcss' at-rule was found in CSS files`)
        }
      }
    },

    // In build mode we add references to only the CSS vars that are used in the bundle.
    // In dev (serve) mode we inline/reference all CSS vars via a style tag.
    transformIndexHtml(html) {
      const tag = getIndexTag()

      return {
        html,
        tags: tag ? [tag] : [],
      }
    },
  }
}
