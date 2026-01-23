import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Config } from '@snowcss/internal'

interface Tokens {
  [key: string]: 'string' | Tokens
}

/** Determines if a property key needs to be quoted. */
function needsQuotes(key: string): boolean {
  return /^\d/.test(key) || key.includes('.')
}

/** Escapes a string for a string literal. */
function quoteString(s: string): string {
  return '`' + s.replaceAll('`', '\\`') + '`'
}

/** Serializes nested tokens object into TypeScript syntax. */
function serializeTokens(tokens: Tokens, indent = 4): string {
  const entries = Object.entries(tokens)

  if (entries.length === 0) {
    return '{}'
  }

  const spaces = ' '.repeat(indent)
  const spacesClosing = ' '.repeat(indent - 2)

  const lines = entries
    .map(([keyRaw, valueRaw]) => {
      const key = needsQuotes(keyRaw) ? `'${keyRaw}'` : keyRaw
      const value =
        typeof valueRaw === 'string' ? quoteString(valueRaw) : serializeTokens(valueRaw, indent + 2)

      return `${spaces}${key}: ${value}`
    })
    .join('\n')

  return ['{', lines, spacesClosing + '}'].join('\n')
}

/** Generates the nested type structure from the config tokens. */
function generateTokensType(config: Config): string {
  const structure: Tokens = {}

  for (const token of config.tokens) {
    const segments = token.path.segments
    let current = structure

    // Traverse all segments except the last one.
    for (let idx = 0; idx < segments.length - 1; idx++) {
      const segment = segments[idx]

      if (!current[segment]) {
        current[segment] = {}
      }

      current = current[segment] as Tokens
    }

    // The last one will be a 'string' type.
    const lastSegment = segments[segments.length - 1]
    current[lastSegment] = token.raw as 'string'
  }

  return serializeTokens(structure)
}

/** Generates the union of all token dot-paths from the config tokens. */
function generateTokenPathType(config: Config): string {
  if (config.tokens.length === 0) {
    return 'string'
  }

  const paths = new Set<string>()

  for (const token of config.tokens) {
    const segments = token.path.segments

    // Add all prefixes including the full path.
    for (let idx = 1; idx <= segments.length; idx++) {
      paths.add(segments.slice(0, idx).join('.'))
    }
  }

  return Array.from(paths)
    .sort()
    .map((path, idx) => {
      const ident = ' '.repeat(idx === 0 ? 0 : 4)
      const value = `${ident}| '${path}'`

      return value
    })
    .join('\n')
}

/** Generates the union of all terminal token dot-paths from the config tokens. */
function generateTokenTerminalPathType(config: Config): string {
  const parts: Array<string> = []

  if (config.tokens.length > 0) {
    for (const [idx, token] of config.tokens.entries()) {
      const ident = ' '.repeat(idx === 0 ? 0 : 4)
      const path = token.path.toDotPath()

      parts.push(`${ident}| '${path}'`)
    }
  } else {
    parts.push('string')
  }

  return parts.join('\n')
}

/** Generates TypeScript definitions for the virtual:snowcss module. */
export function generateTypes(config: Config): string {
  const tokensType = generateTokensType(config)
  const tokenPathType = generateTokenPathType(config)
  const tokenTerminalPathType = generateTokenTerminalPathType(config)

  const dts = `
interface SnowTokenRegistry {
  tokens: ${tokensType}
  path:
    ${tokenPathType}
  terminalPath:
    ${tokenTerminalPathType}
}
`.trim()

  return dts
}

/** Writes TypeScript definitions to node_modules/.vite/snowcss.d.ts. */
export function writeTypesFile(config: Config, viteRoot: string): void {
  const typesDir = join(viteRoot, 'node_modules', '.snowcss')
  const typesFile = join(typesDir, 'client.d.ts')

  const dts = generateTypes(config)

  try {
    mkdirSync(typesDir, { recursive: true })
    writeFileSync(typesFile, dts, 'utf-8')
  } catch (error) {
    console.warn('[snowcss] Failed to write types file:', error)
  }
}
