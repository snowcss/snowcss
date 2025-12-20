import type { TokenValue, TokenValueInput, TokenValueParser } from './index'

/** Represents any other value that has no appropriate representation in Snow CSS. */
export class RawValue {
  constructor(
    /** Raw value as a string. */
    public readonly raw: string,
  ) {}
}

export class RawParser implements TokenValueParser {
  tryParse({ input }: TokenValueInput): TokenValue {
    return new RawValue(input)
  }
}
