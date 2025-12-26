import type { Path } from '@/path'
import type { ValueModifier } from '@/token'

/** Represents a parsed value() CSS function call. */
export class ValueFunction {
  /** CSS function name. */
  static readonly cssFunctionName = 'value'

  constructor(
    /** Token path (e.g., 'colors.gray.50'). */
    public readonly path: Path,
    /** Optional modifier (unit conversion or alpha). */
    public readonly modifier: ValueModifier | null,
  ) {}
}
