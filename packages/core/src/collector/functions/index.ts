import { TokenFunction } from './token'
import { ValueFunction, type ValueModifier } from './value'

export type SnowFunction = TokenFunction | ValueFunction

// Re-export.
export { TokenFunction, ValueFunction, type ValueModifier }
