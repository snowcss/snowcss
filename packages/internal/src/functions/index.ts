import type { TokenFunction } from './token'
import type { ValueFunction } from './value'

export type SnowFunction = TokenFunction | ValueFunction

// Re-export constants, functions, and parsers.
export * from './constants'
export * from './token'
export * from './value'
