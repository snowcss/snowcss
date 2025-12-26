import type { SnowFunction } from '@/collector'
import { TokenFunction } from '@/collector'
import type { Config } from '@/config'
import type { Path } from '@/path'
import type { ModifyContext, Token, TokenValue } from '@/token'

/** Resolved token with original values and resolved CSS output. */
export class ResolvedToken {
  constructor(
    /** Original token path. */
    public readonly path: Path,
    /** Original parsed values. */
    public readonly values: Array<TokenValue>,
    /** Final CSS values after modifier application. */
    public readonly resolved: Array<string>,
  ) {}
}

/** Result of resolving functions against tokens. */
export interface ResolverResult {
  resolved: Array<ResolvedToken>
  unresolved: Array<SnowFunction>
}

/** Resolves extracted CSS functions against config tokens. */
export class Resolver {
  constructor(private config: Config) {}

  public load(config: Config): void {
    this.config = config
  }

  /** Resolves functions against tokens, returning matched and unmatched results. */
  public resolve(functions: Array<SnowFunction>): ResolverResult {
    const resolved: Array<ResolvedToken> = []
    const unresolved: Array<SnowFunction> = []

    for (const fn of functions) {
      const token = this.findToken(fn.path)

      if (!token) {
        unresolved.push(fn)
        continue
      }

      const resolvedValues = this.resolveValues(token, fn)
      const resolvedToken = new ResolvedToken(token.path, token.values, resolvedValues)

      resolved.push(resolvedToken)
    }

    return { resolved, unresolved }
  }

  /** Finds a token matching the function path, accounting for prefix. */
  private findToken(functionPath: Path): Token | null {
    return (
      this.config?.tokens.find((token) => {
        const tokenSegments = this.config?.config.prefix
          ? token.path.segments.slice(1)
          : token.path.segments

        return tokenSegments.join('.') === functionPath.segments.join('.')
      }) ?? null
    )
  }

  /** Creates the modify context from config. */
  private createModifyContext(): ModifyContext {
    return {
      rootFontSize: this.config.config.rootFontSize ?? 16,
    }
  }

  /** Resolves token values, applying modifier if applicable. */
  private resolveValues(token: Token, fn: SnowFunction): Array<string> {
    // TokenFunction has no modifier, always return raw value.
    if (fn instanceof TokenFunction) {
      return [token.raw]
    }

    // ValueFunction with no modifier, return raw value.
    if (!fn.modifier) {
      return [token.raw]
    }

    // Only apply modifiers to tokens with exactly one value.
    if (token.values.length !== 1) {
      return [token.raw]
    }

    const value = token.values[0]
    const ctx = this.createModifyContext()
    const resolved = value.apply(fn.modifier, ctx)

    return [resolved ?? token.raw]
  }
}
