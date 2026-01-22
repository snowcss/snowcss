/* biome-ignore-all lint/correctness/noUnusedFunctionParameters: Intentionally stubbed. */

import type { GetByPath, SplitPath } from './types'

interface Tokens {
  [key: string]: string | Tokens
}

declare global {
  /** Base interface for token registry. Augmented by generated types from the Vite plugin. */
  interface SnowTokenRegistry {
    /** Contains all resolved snowcss tokens. */
    tokens: Tokens
    /** Contains a union of all token dot-paths. */
    path: string
    /** Contains a union of all terminal token dot-paths. */
    terminalPath: string
  }
}

/** Contains all resolved snowcss tokens. */
export type SnowTokens = SnowTokenRegistry['tokens']

/** Contains a union of all token dot-paths. */
export type SnowPath = SnowTokenRegistry['path']

/** Contains a union of all terminal token dot-paths. */
export type SnowTerminalPath = SnowTokenRegistry['terminalPath']

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
