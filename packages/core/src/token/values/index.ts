import type { CssNode } from 'css-tree'

import { PxParser, PxValue } from './absolute'
import { ColorParser, ColorValue } from './color'
import { RemParser, RemValue } from './relative'
import { RawParser, RawValue } from './value'

export type TokenValue = PxValue | ColorValue | RemValue | RawValue

export interface TokenValueInput {
  /** Raw input value to be parsed. */
  input: string
  /** CSS Tree node. */
  node: CssNode
}

export interface TokenValueParser {
  tryParse: (input: TokenValueInput) => TokenValue | null
}

export class ValueParserChain {
  constructor(private readonly parsers: Array<TokenValueParser>) {}

  public parse(input: TokenValueInput): TokenValue | null {
    for (const parser of this.parsers) {
      const result = parser.tryParse(input)

      if (result) {
        return result
      }
    }

    return null
  }
}

// Re-export values and parsers.
export { PxParser, PxValue, ColorParser, ColorValue, RemParser, RemValue, RawParser, RawValue }

// Re-export modifier types.
export type { Modifiable, ModifyContext, ValueModifier } from './modifier'
