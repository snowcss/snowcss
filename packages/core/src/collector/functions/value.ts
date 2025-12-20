import type { Path } from '@/path'

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

export type ValueModifier = UnitModifier | AlphaModifier

/** Represents a parsed value() CSS function call. */
export class ValueFunction {
  /** Css function name. */
  static readonly cssFunctionName = 'value'

  constructor(
    /** Token path (e.g., 'colors.gray.50'). */
    public readonly path: Path,
    /** Optional modifier (unit conversion or alpha). */
    public readonly modifier: ValueModifier | null,
  ) {}
}
