import type { TokenValue, TokenValueInput, TokenValueParser } from './index'

/** Root relative units we recognize. */
const ROOT_RELATIVE_UNITS = ['rcap', 'rch', 'rem', 'rex', 'ric', 'rlh']

/** Represents a value in relative units. */
export class RelativeValue {
  constructor(
    /** Raw value as a string. */
    public readonly raw: string,
    /** Unit of the value. */
    public readonly unit: string,
    /** Parsed value as a number. */
    public readonly parsed: number,
  ) {}
}

export class RelativeParser implements TokenValueParser {
  tryParse({ input, node }: TokenValueInput): TokenValue | null {
    if (node.type === 'Dimension' && ROOT_RELATIVE_UNITS.includes(node.unit)) {
      return new RelativeValue(input, node.unit, parseFloat(node.value))
    }

    return null
  }
}
