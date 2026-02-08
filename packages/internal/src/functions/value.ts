import type { Path } from '#path'
import type { Token } from '#token'
import type { Location, ToCacheKey } from '#types'
import { hash } from '#utils'
import type { ValueModifier } from '#values'
import { AlphaModifier, NegateModifier, UnitModifier } from '#values'

import { SnowFunctionName } from './constants'
import type { SnowFunction } from './index'
import { SnowFunctionParser } from './parser'

/** Represents a parsed --value() CSS function call. */
export class ValueFunction implements ToCacheKey<Token> {
  /** CSS function name/type. */
  get name(): SnowFunctionName {
    return SnowFunctionName.Value
  }

  constructor(
    /** Token path (e.g., 'colors.gray.50'). */
    readonly path: Path,
    /** Optional modifier (unit conversion or alpha). */
    readonly modifier: ValueModifier | null,
    /** Location of the function call in the source. */
    readonly location: Location,
  ) {}

  toCacheKey(token: Token): string {
    const modifier = String(this.modifier?.toCacheKey())

    // Not using the path because it's already encoded in the token.
    return `value:${token.toCacheKey()}:${hash(modifier)}`
  }
}

export class ValueFunctionParser extends SnowFunctionParser {
  parse(): SnowFunction | null {
    const path = this.path()

    if (!path) {
      return null
    }

    return new ValueFunction(path, this.modifier(), this.location)
  }

  private modifier(): ValueModifier | null {
    const op = this.advance()

    // No modifier.
    if (!op) {
      return null
    }

    // Handle `to <unit>` modifier.
    if (op.type === 'Identifier' && op.name === 'to') return this.unitModifier()

    // Handle `negate` modifier.
    if (op.type === 'Identifier' && op.name === 'negate') return new NegateModifier()

    // Handle `/ <percentage>` modifier.
    if (op.type === 'Operator' && op.value === '/') return this.alphaModifier()

    return this.error('unexpected --value() modifier')
  }

  private unitModifier(): UnitModifier | null {
    const unit = this.advance()

    if (!unit || unit.type !== 'Identifier') {
      return this.error(`expected unit identifier after 'to': px, rem`)
    }

    if (unit.name !== 'px' && unit.name !== 'rem') {
      return this.error(`unexpected unit '${unit.name}'; expected 'px' or 'rem'`)
    }

    return new UnitModifier(unit.name)
  }

  private alphaModifier(): AlphaModifier | null {
    const percent = this.advance()

    if (!percent || percent.type !== 'Percentage') {
      return this.error(`expected percentage value after '/'`)
    }

    return new AlphaModifier(parseFloat(percent.value) / 100)
  }
}
