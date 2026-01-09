import type { Context } from './context'

interface SerializedToken {
  raw: string
  cssVar: string
}

interface Tokens {
  [key: string]: 'string' | Tokens
}

/**
 * Creates a flat lookup map for efficient token access.
 * Maps dot-notation paths to token data.
 */
function createLookupMap(context: Context): Record<string, SerializedToken> {
  const map: Record<string, SerializedToken> = {}

  for (const token of context.config.tokens) {
    const dotPath = token.path.toDotPath()
    map[dotPath] = {
      raw: token.raw,
      cssVar: token.path.toCssVar(),
    }
  }

  return map
}

/**
 * Creates a nested object structure matching the original config.
 * Preserves the hierarchical organization of tokens.
 */
function createTokens(context: Context): Tokens {
  const tokens: Tokens = {}

  for (const token of context.config.tokens) {
    const segments = token.path.segments
    let current = tokens

    // Traverse all segments except the last one.
    for (let idx = 0; idx < segments.length - 1; idx++) {
      const segment = segments[idx]

      if (!current[segment]) {
        current[segment] = {}
      }

      current = current[segment] as Tokens
    }

    // Assign the value at the final segment.
    const lastSegment = segments[segments.length - 1]
    current[lastSegment] = token.raw as 'string'
  }

  return tokens
}

/**
 * Generates the JavaScript module code for the virtual:snowcss module.
 * Returns a string containing the complete module with runtime functions.
 */
export function generateVirtualModule(context: Context): string {
  const lookup = createLookupMap(context)
  const tokens = createTokens(context)

  const lookupJson = JSON.stringify(lookup)
  const tokensJson = JSON.stringify(tokens)

  return `
const LOOKUP = ${lookupJson};
const TOKENS = ${tokensJson};

export function value(path) {
  const token = LOOKUP[path];
  if (!token) {
    console.warn('[snowcss] Token not found: ' + path)
    return '<unresolved>';
  }
  return token;
}

export function token(path) {
  const token = LOOKUP[path];
  if (!token) {
    console.warn('[snowcss] Token not found: ' + path);
    return '<unresolved>';
  }
  return 'var(' + token.cssVar + ')';
}

export function tokens() {
  return TOKENS;
}
`.trim()
}
