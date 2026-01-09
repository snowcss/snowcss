import type { TokenFunction } from './token'
import type { ValueFunction } from './value'

export const SnowFunctionName = {
  Token: '--token',
  Value: '--value',
} as const

export type SnowFunctionName = (typeof SnowFunctionName)[keyof typeof SnowFunctionName]
export type SnowFunction = TokenFunction | ValueFunction

// Re-export functions and parsers.
export * from './token'
export * from './value'
