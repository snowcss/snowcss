import { readFileSync } from 'node:fs'

import type { Context } from '#context'

const REGISTRY_PLACEHOLDER = '/* REGISTRY */'

interface TokensRegistry {
  [segment: string]: string | TokensRegistry
}

/**
 * Determines if a token should be included based on the provided patterns.
 *
 * Supports three pattern types:
 *
 * - Exact matches: 'color.primary' matches only that specific token.
 * - Wildcard patterns: 'color.*' matches all tokens in that namespace.
 * - RegExp patterns: /^color\./ for complex matching.
 */
function shouldIncludeToken(tokenPath: string, patterns: Array<string | RegExp>): boolean {
  if (!patterns || patterns.length === 0) return true

  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      // Exact match.
      if (pattern === tokenPath) return true

      // Wildcard pattern match.
      if (pattern.endsWith('.*')) {
        const prefix = pattern.slice(0, -2)

        // Must match prefix exactly and be followed by dot or be exact match.
        if (tokenPath === prefix || tokenPath.startsWith(prefix + '.')) {
          return true
        }
      }
    } else if (pattern instanceof RegExp) {
      // RegExp match.
      if (pattern.test(tokenPath)) return true
    }
  }

  return false
}

/**
 * Creates a tokens registry. Preserves the hierarchical organization of tokens but instead of
 * values leaves are mapped to a registry node.
 */
function createTokensRegistry(context: Context, filters?: Array<string | RegExp>): TokensRegistry {
  const tokens: TokensRegistry = {}

  // Filter tokens if filters are provided.
  const includedTokens =
    filters && filters.length > 0
      ? context.config.tokens.filter((token) => shouldIncludeToken(token.path.toDotPath(), filters))
      : context.config.tokens

  for (const token of includedTokens) {
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
export function generateVirtualModule(
  context: Context,
  runtimeTokens?: Array<string | RegExp>,
): string {
  const runtimePath = new URL('./runtime.js', import.meta.url)
  const runtimeCode = readFileSync(runtimePath, 'utf8')

  const registry = JSON.stringify(createTokensRegistry(context, runtimeTokens))

  return runtimeCode.replace(REGISTRY_PLACEHOLDER, registry)
}
