import type { CssNode } from 'css-tree'

import { AbsoluteParser, AbsoluteValue } from './absolute'
import { ColorParser, ColorValue } from './color'
import { RelativeParser, RelativeValue } from './relative'
import { RawParser, RawValue } from './value'

export type TokenValue = AbsoluteValue | ColorValue | RelativeValue | RawValue

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

// Re-exports.
export {
  AbsoluteParser,
  AbsoluteValue,
  ColorParser,
  ColorValue,
  RelativeParser,
  RelativeValue,
  RawParser,
  RawValue,
}
