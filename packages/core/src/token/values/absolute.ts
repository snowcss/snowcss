import type { TokenValue, TokenValueInput, TokenValueParser } from './index'

/** Represents a value in pixels. */
export class AbsoluteValue {
  constructor(
    /** Raw value as a string. */
    public readonly raw: string,
    /** Unit of the value. In this case it's always "px". */
    public readonly unit: string,
    /** Parsed value as a number. */
    public readonly parsed: number,
  ) {}
}

export class AbsoluteParser implements TokenValueParser {
  tryParse({ input, node }: TokenValueInput): TokenValue | null {
    if (node.type === 'Dimension' && node.unit === 'px') {
      return new AbsoluteValue(input, node.unit, parseFloat(node.value))
    }

    return null
  }
}
