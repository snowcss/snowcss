import type { TokenValue, TokenValueInput, TokenValueParser } from './index'
import type { Modifiable, ModifyContext, ValueModifier } from './modifier'

/** Represents a value in rem units. */
export class RemValue implements Modifiable {
  constructor(
    /** Raw value as a string. */
    public readonly raw: string,
    /** Parsed value as a number. */
    public readonly parsed: number,
  ) {}

  /** Applies a modifier to this rem value. */
  public apply(modifier: ValueModifier, ctx: ModifyContext): string | null {
    if (modifier.type === 'unit') {
      // Already rem, return as-is.
      if (modifier.unit === 'rem') {
        return `${this.parsed}rem`
      }

      // Convert to px.
      if (modifier.unit === 'px') {
        return `${this.parsed * ctx.rootFontSize}px`
      }
    }

    return null
  }
}

export class RemParser implements TokenValueParser {
  tryParse({ input, node }: TokenValueInput): TokenValue | null {
    if (node.type === 'Dimension' && node.unit === 'rem') {
      return new RemValue(input, parseFloat(node.value))
    }

    return null
  }
}
