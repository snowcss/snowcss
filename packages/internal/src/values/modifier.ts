import type { ToCacheKey } from '#types'

/** Unit conversion modifier for --value() function. */
export class UnitModifier implements ToCacheKey {
  constructor(
    /** Unit to convert to. */
    readonly unit: 'px' | 'rem',
  ) {}

  toCacheKey(): string {
    return `unit:${this.unit}`
  }
}

/** Alpha channel modifier for --value() function. */
export class AlphaModifier implements ToCacheKey {
  constructor(
    /** Alpha value as a decimal (e.g., 0.5 for 50%). */
    readonly value: number,
  ) {}

  toCacheKey(): string {
    return `alpha:${this.value}`
  }
}

/** Negate modifier for --value() function. */
export class NegateModifier implements ToCacheKey {
  toCacheKey(): string {
    return 'negate'
  }
}

/** Modifier for --value() function. */
export type ValueModifier = UnitModifier | AlphaModifier | NegateModifier

/** Modifier kind discriminator. */
export type ModifierKind = 'unit' | 'alpha' | 'negate'

/** Context for applying modifiers, contains configuration needed for conversions. */
export interface ModifyContext {
  /** Root font size in pixels for rem/px conversion. */
  rootFontSize: number
}

/** Interface for token values that can have modifiers applied. */
export interface Modifiable {
  /** Applies a modifier to this value, returning the CSS string or null if unsupported. */
  apply(modifier: ValueModifier, ctx: ModifyContext): string | null
}
