import { TokenFunction } from './token'
import type { ValueModifier } from './value'
import { ValueFunction } from './value'

export type SnowFunction = TokenFunction | ValueFunction

// Re-export.
export { TokenFunction, ValueFunction, type ValueModifier }
