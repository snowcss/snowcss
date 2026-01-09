import type { TokenValue, TokenValueInput, TokenValueParser } from './index'
import type { Modifiable, ModifyContext, ValueModifier } from './modifier'
import { NegateModifier, UnitModifier } from './modifier'

/** Represents a value in px units. */
export class PxValue implements Modifiable {
  constructor(
    /** Raw value as a string. */
    readonly raw: string,
    /** Parsed value as a number. */
    readonly parsed: number,
  ) {}

  /** Applies a modifier to this px value. */
  apply(modifier: ValueModifier, ctx: ModifyContext): string | null {
    if (modifier instanceof UnitModifier) {
      // Already px, return as-is.
      if (modifier.unit === 'px') {
        return `${this.parsed}px`
      }

      // Convert px to rem.
      if (modifier.unit === 'rem') {
        return `${this.parsed / ctx.rootFontSize}rem`
      }
    }

    if (modifier instanceof NegateModifier) {
      return `${-this.parsed}px`
    }

    return null
  }
}

export class PxParser implements TokenValueParser {
  tryParse({ input, node }: TokenValueInput): TokenValue | null {
    if (node.type === 'Dimension' && node.unit === 'px') {
      return new PxValue(input, parseFloat(node.value))
    }

    return null
  }
}
