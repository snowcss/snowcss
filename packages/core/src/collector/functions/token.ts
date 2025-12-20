import type { Path } from '@/path'

/** Represents a parsed token() CSS function call. */
export class TokenFunction {
  /** CSS function name. */
  static readonly cssFunctionName = 'token'

  constructor(
    /** Token path (e.g., 'colors.gray.50'). */
    public readonly path: Path,
  ) {}
}
