/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: Intentionally stubbed. */

/** Base interface for token registry. Augmented by generated types from the Vite plugin. */
declare global {
  interface SnowTokenRegistry {
    tokens: object
    path: string
  }
}

type SnowTokens = SnowTokenRegistry['tokens']
type SnowPath = SnowTokenRegistry['path']

// These functions are stubs for non-Vite usage. When using the Vite plugin, imports from 'snowcss'
// (more specifically snowcss/client) are resolved to the virtual module which provides the actual
// implementations with access to the design tokens.

/** Returns the token value for the given path. */
export function token(path: SnowPath): string {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}

/** Returns the full token index (all values for dev, only used for prod build) as a lookup map. */
export function tokens(): SnowTokens {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}

/** Returns the token value for the given path. */
export function value(path: SnowPath): string {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}
