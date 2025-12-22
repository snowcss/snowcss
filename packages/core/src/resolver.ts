import { type SnowFunction, TokenFunction, type ValueModifier } from '@/collector'
import type { Config } from '@/config'
import type { Path } from '@/path'
import type { Token } from '@/token'
import { AbsoluteValue, ColorValue, RelativeValue, type TokenValue } from '@/token'

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
    return this.config?.tokens.find((token) => this.matchPaths(token.path, functionPath)) ?? null
  }

  /** Compares token path (with potential prefix) to function path (without prefix). */
  private matchPaths(tokenPath: Path, functionPath: Path): boolean {
    const tokenSegments = this.config?.config.prefix
      ? tokenPath.segments.slice(1)
      : tokenPath.segments

    return tokenSegments.join('.') === functionPath.segments.join('.')
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
    const resolved = this.applyModifier(value, fn.modifier)

    return [resolved ?? token.raw]
  }

  /** Applies a modifier to a token value, returning the CSS string or null if unsupported. */
  private applyModifier(value: TokenValue, modifier: ValueModifier): string | null {
    if (modifier.type === 'alpha') {
      return this.applyAlphaModifier(value, modifier.value)
    }

    if (modifier.type === 'unit') {
      return this.applyUnitModifier(value, modifier.unit)
    }

    return null
  }

  /** Applies alpha modifier to a color value. */
  private applyAlphaModifier(value: TokenValue, alpha: number): string | null {
    if (!(value instanceof ColorValue)) {
      return null
    }

    return value.modify({ alpha }).toCss()
  }

  /** Applies unit modifier to a relative value. */
  private applyUnitModifier(value: TokenValue, unit: 'px' | 'rem'): string | null {
    if (!(value instanceof RelativeValue) && !(value instanceof AbsoluteValue)) {
      return null
    }

    const rootFontSize = this.config.config.rootFontSize ?? 16

    if (unit === 'px') {
      return `${value.parsed * rootFontSize}px`
    }

    if (unit === 'rem') {
      // Already rem, return as-is.
      if (value.unit === 'rem') {
        return `${value.parsed}rem`
      }

      // Convert from other root-relative units to rem.
      return `${value.parsed / rootFontSize}rem`
    }

    return null
  }
}
