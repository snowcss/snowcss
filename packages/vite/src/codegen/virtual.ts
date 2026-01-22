import { readFileSync } from 'node:fs'

import type { Context } from '#context'

const REGISTRY_PLACEHOLDER = '/* REGISTRY */'

interface TokensRegistry {
  [segment: string]: string | TokensRegistry
}

/**
 * Creates a tokens registry. Preserves the hierarchical organization of tokens but instead of
 * values leaves are mapped to a registry node.
 */
function createTokensRegistry(context: Context): TokensRegistry {
  const tokens: TokensRegistry = {}

  for (const token of context.config.tokens) {
    const segments = token.path.segments
    const length = segments.length - 1
    let current = tokens

    // Traverse all segments except the last one.
    for (let idx = 0; idx < length; idx++) {
      const segment = segments[idx]

      if (!current[segment]) {
        current[segment] = {}
      }

      current = current[segment] as TokensRegistry
    }

    // Assign the value at the final segment.
    const lastSegment = segments[length]

    current[lastSegment] = token.raw
  }

  return tokens
}

/** Generates the virtual module. */
export function generateVirtualModule(context: Context): string {
  const runtimePath = new URL('./runtime.js', import.meta.url)
  const runtimeCode = readFileSync(runtimePath, 'utf8')

  const registry = JSON.stringify(createTokensRegistry(context))

  return runtimeCode.replace(REGISTRY_PLACEHOLDER, registry)
}
