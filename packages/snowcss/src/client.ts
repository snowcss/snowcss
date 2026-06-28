/* biome-ignore-all lint/correctness/noUnusedFunctionParameters: Intentionally stubbed. */

import type { GetByPath, SplitPath } from './types'

interface Tokens {
  [key: string]: string | Tokens
}

/** Fallback shape used when the Vite plugin has not augmented {@link SnowTokenRegistry}. */
interface SnowTokenRegistryFallback {
  /** Contains all resolved snowcss tokens. */
  tokens: Tokens
  /** Contains a union of all token dot-paths. */
  path: string
  /** Contains a union of all terminal token dot-paths. */
  terminalPath: string
}

declare global {
  /**
   * Token registry. The Vite plugin merges concrete `tokens`, `path` and `terminalPath` members
   * into this interface. It is left empty here so the generated declaration merges without a
   * conflicting-types error.
   */
  interface SnowTokenRegistry {}
}

/** The plugin-augmented registry, or the fallback shape when it has not been augmented. */
type Registry = keyof SnowTokenRegistry extends never
  ? SnowTokenRegistryFallback
  : SnowTokenRegistry

/** Contains all resolved snowcss tokens. */
export type SnowTokens = Registry['tokens']

/** Contains a union of all token dot-paths. */
export type SnowPath = Registry['path']

/** Contains a union of all terminal token dot-paths. */
export type SnowTerminalPath = Registry['terminalPath']

/** Gets a value by path from the {@link SnowTokens}. */
export type GetValue<P extends string> = GetByPath<SnowTokens, SplitPath<P>>

/** Gets a token reference and value by terminal path from the {@link SnowTokens}. */
export type GetToken<P extends string, V = GetValue<P>> = V

// These functions are stubs for non-Vite usage. When using the Vite plugin, imports from 'snowcss'
// (more specifically snowcss/client) are resolved to the virtual module which provides the actual
// implementations with access to the design tokens.

/** Returns the token reference for the given terminal path. */
export function token<P extends SnowTerminalPath>(path: P): GetToken<P> {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}

/** Returns the full token index. */
export function tokens(): SnowTokens {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}

/** Returns the token value for the given path. */
export function value<P extends SnowPath>(path: P): GetValue<P> {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}

/** Resolves all tokens and places them in the cache for the O(1) runtime access. */
export function warmupCache(): void {
  throw new Error('Snow CSS requires the Vite plugin to be configured')
}
