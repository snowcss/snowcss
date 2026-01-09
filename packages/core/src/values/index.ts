import type { CssNode } from 'css-tree'

import type { PxValue } from './absolute'
import type { ColorValue } from './color'
import type { CommaValue } from './operator'
import type { RemValue } from './relative'
import type { RawValue } from './value'

export type TokenValue = PxValue | ColorValue | RemValue | RawValue | CommaValue

export interface TokenValueInput {
  /** Raw input value to be parsed. */
  input: string
  /** CSS Tree node. */
  node: CssNode
}

export interface TokenValueParser {
  /**
   * Try to parse the given input. If `null` is returned, the input is not supported and parser
   * chain will move on to the next parser.
   */
  tryParse: (input: TokenValueInput) => TokenValue | null
}

export class ValueParserChain {
  constructor(private readonly parsers: Array<TokenValueParser>) {}

  parse(input: TokenValueInput): TokenValue | null {
    for (const parser of this.parsers) {
      const result = parser.tryParse(input)

      if (result) {
        return result
      }
    }

    return null
  }
}

// Re-export values, parsers, modifier-related types.
export * from './absolute'
export * from './color'
export * from './modifier'
export * from './operator'
export * from './relative'
export * from './value'
