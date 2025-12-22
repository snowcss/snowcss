import { type SnowFunction, TokenFunction, ValueFunction, type ValueModifier } from './functions'
import { Parser } from './parser'

/** Given a CSS string, returns a list of all Snow CSS function usages. */
export function collect(input: string): Array<SnowFunction> {
  const parser = Parser.fromCss(input)
  const functions = parser.parse()

  return functions
}

// Re-export.
export { type SnowFunction, TokenFunction, ValueFunction, type ValueModifier }
