/** Unit conversion modifier for value() function. */
export type UnitModifier = {
  type: 'unit'
  unit: 'px' | 'rem'
}

/** Alpha channel modifier for value() function. */
export type AlphaModifier = {
  type: 'alpha'
  /** Alpha value as a decimal (e.g., 0.5 for 50%). */
  value: number
}

/** Modifier for value() function. */
export type ValueModifier = UnitModifier | AlphaModifier

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
