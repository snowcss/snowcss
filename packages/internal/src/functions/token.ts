import type { Path } from '#path'
import type { Token } from '#token'
import type { Location, ToCacheKey } from '#types'

import { SnowFunctionName } from './constants'
import type { SnowFunction } from './index'
import { SnowFunctionParser } from './parser'

/** Represents a parsed --token() CSS function call. */
export class TokenFunction implements ToCacheKey<Token> {
  /** CSS function name/type. */
  get name(): SnowFunctionName {
    return SnowFunctionName.Token
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

    // Check for unexpected trailing content.
    const trailing = this.advance()

    if (trailing) {
      return this.error('--token() does not support modifiers')
    }

    return new TokenFunction(path, this.location)
  }
}
