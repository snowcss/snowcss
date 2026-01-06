import type { Path } from '@/path'
import type { Token } from '@/token'
import type { Location, ToCacheKey } from '@/types'

import type { SnowFunction, SnowFunctionName } from './index'
import { SnowFunctionParser } from './parser'

/** Represents a parsed token() CSS function call. */
export class TokenFunction implements ToCacheKey<Token> {
  static readonly fn: SnowFunctionName = 'token'

  /** CSS function name/type. */
  get name(): SnowFunctionName {
    return TokenFunction.fn
  }

  constructor(
    /** Token path (e.g., 'colors.gray.50'). */
    readonly path: Path,
    /** Location of the function call in the source. */
    readonly location: Location,
  ) {}

  toCacheKey(token: Token): string {
    // Not using the path because it's already encoded in the token.
    return `token:${token.toCacheKey()}`
  }
}

export class TokenFunctionParser extends SnowFunctionParser {
  parse(): SnowFunction | null {
    const path = this.path()

    if (!path) {
      return null
    }

    return new TokenFunction(path, this.location)
  }
}
