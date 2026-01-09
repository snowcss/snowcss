import type { HtmlTagDescriptor, Plugin } from 'vite'

import { VIRTUAL_CSS_ID, VIRTUAL_CSS_ID_RESOLVED } from './constants'
import { Context } from './context'
import { serveVirtualCss } from './middlewares'

const ATRULE_PATTERN = /@snowcss\s*;/g

interface SnowPluginOptions {
  /** Path to the Snow CSS config file. */
  config?: string
}

export default function snowCssPlugin(options: SnowPluginOptions = {}): Plugin {
  let snowContext: Context

  let isBuild: boolean = false
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

  return {
    name: 'vite-plugin-snowcss',

    async config({ root }) {
      try {
        snowContext = await Context.create({
          root,
          path: options.config,
        })
      } catch (error) {
        if (error instanceof Error) {
          this.error('failed to load snowcss config')
        }
      }
    },

    configResolved({ command }) {
      isBuild = command === 'build'
    },

    configureServer(server) {
      // Watch for snow config changes.
      server.watcher.add(snowContext.config.path).on('change', (file) => {
        if (file === snowContext.config.path) {
          server.restart()
        }
      })

      // Add middleware to handle virtual CSS modules.
      server.middlewares.use(serveVirtualCss(snowContext))
    },

    resolveId(id) {
      if (id === VIRTUAL_CSS_ID) {
        return VIRTUAL_CSS_ID_RESOLVED
      }
    },

    load(id) {
      if (id === VIRTUAL_CSS_ID_RESOLVED) {
        const css = snowContext.emitAllCss({
          minify: false,
        })

        return css ?? ''
      }
    },

    transform(code, id) {
      if (!id.includes('node_modules') && id.endsWith('.css')) {
        const inject = snowContext.config.config.inject
        const [resolved, diagnostics] = snowContext.collect(code)

        if (diagnostics.size) {
          for (const diagnostic of diagnostics) {
            const message = {
              message: diagnostic.message,
              code: diagnostic.context,
            }

            if (diagnostic.severity === 'error') this.error(message)
            if (diagnostic.severity === 'warning') this.warn(message)
            if (diagnostic.severity === 'info') this.info(message)
          }
        }

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

          // TODO(norskeld): This is far from ideal, instead of this we need to introduce a new
          // token kind that will be used to inject the @snowcss; directive.
          if (isAtRuleFile && ATRULE_PATTERN.test(result)) {
            atRuleFileId = id
            ATRULE_PATTERN.lastIndex = 0

            const css = snowContext.emitAllCss({
              minify: false,
            })

            result = result.replace(ATRULE_PATTERN, css ?? '')
          }
        }

        return result
      }

      return null
    },

    // This hook only works in build mode, so here we emit used CSS variables.
    generateBundle(_, bundle) {
      const inject = snowContext.config.config.inject

      const source = snowContext.emitCss({
        minify: true,
      })

      if (!source) {
        return
      }

      if (inject === 'asset') {
        const file = this.emitFile({
          type: 'asset',
          name: 'snow.css',
          source,
        })

        assetFileId = this.getFileName(file)
      }

      if (inject === 'inline') {
        assetSource = source
      }

      if (inject === 'at-rule') {
        let atRuleFound = false

        for (const [fileName, asset] of Object.entries(bundle)) {
          if (asset.type === 'asset' && fileName.endsWith('.css')) {
            const content = typeof asset.source === 'string' ? asset.source : ''

            if (ATRULE_PATTERN.test(content)) {
              ATRULE_PATTERN.lastIndex = 0
              asset.source = content.replace(ATRULE_PATTERN, source)
              atRuleFound = true
            }
          }
        }

        if (!atRuleFound) {
          this.warn(
            `inject is set to 'at-rule', but no '@snowcss;' directive was found in CSS files`,
          )
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
