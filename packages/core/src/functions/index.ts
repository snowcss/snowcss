import type { TokenFunction } from './token'
import type { ValueFunction } from './value'

export type SnowFunctionName = 'token' | 'value'
export type SnowFunction = TokenFunction | ValueFunction

// Re-export functions and parsers.
export * from './token'
export * from './value'
