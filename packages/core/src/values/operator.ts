import type { TokenValue, TokenValueInput, TokenValueParser } from './index'
import type { Modifiable, ModifyContext, ValueModifier } from './modifier'

/** Represents a comma that is used to separate multiple values. */
export class CommaValue implements Modifiable {
  constructor(
    /** Raw value as a string. */
    readonly raw: string,
  ) {}

  /** CommaValue does not support any modifiers. */
  apply(_modifier: ValueModifier, _ctx: ModifyContext): string | null {
    return null
  }
}

export class CommaParser implements TokenValueParser {
  tryParse({ node }: TokenValueInput): TokenValue | null {
    if (node.type === 'Operator' && node.value === ',') {
      return new CommaValue(node.value)
    }

    return null
  }
}
