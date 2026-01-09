import type { TokenValue, TokenValueInput, TokenValueParser } from './index'
import type { Modifiable, ModifyContext, ValueModifier } from './modifier'

/** Represents any other value that has no appropriate representation in Snow CSS. */
export class RawValue implements Modifiable {
  constructor(
    /** Raw value as a string. */
    readonly raw: string,
  ) {}

  /** RawValue does not support any modifiers. */
  apply(_modifier: ValueModifier, _ctx: ModifyContext): string | null {
    return null
  }
}

export class RawParser implements TokenValueParser {
  tryParse({ input }: TokenValueInput): TokenValue {
    return new RawValue(input)
  }
}
