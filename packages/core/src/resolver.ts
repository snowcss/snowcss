import type { Config } from './config'
import type { WithDiagnostics } from './diagnostics'
import { Diagnostics } from './diagnostics'
import type { SnowFunction, SnowFunctionName } from './functions'
import { TokenFunction, ValueFunction } from './functions'
import type { Path } from './path'
import type { Token } from './token'
import type { Location } from './types'
import type { ModifyContext, TokenValue } from './values'

/** Resolved token with original values and resolved CSS output. */
export class ResolvedToken {
  constructor(
    /** Snow function associated with this token. */
    readonly name: SnowFunctionName,
    /** Original token path. */
    readonly path: Path,
    /** Original parsed values. */
    readonly values: Array<TokenValue>,
    /** Final CSS values after modifier application. */
    readonly resolved: Array<string>,
    /** Location of the associated function call in the source CSS. */
    readonly location: Location,
  ) {}

  /** Returns either a CSS variable reference or a resolved CSS value. */
  toCss(): string {
    return this.name === 'token' ? this.path.toCssVarRef() : this.resolved.join(' ')
  }
}

/** Resolves functions against tokens from a given config, emitting diagnostics if any. */
export function resolve(
  config: Config,
  functions: Array<SnowFunction>,
): WithDiagnostics<Array<ResolvedToken>> {
  const diagnostics = new Diagnostics()
  const resolved: Array<ResolvedToken> = []

  for (const fn of functions) {
    const token = config.getByPath(fn.path)

    if (token) {
      const resolvedToken = resolveToken(config, token, fn, diagnostics)

      resolved.push(resolvedToken)
    } else {
      diagnostics.warning({
        message: `token '${fn.path.toDotPath()}' not found`,
        context: 'resolver',
      })
    }
  }

  return [resolved, diagnostics]
}

/** Resolves all tokens as if they were referenced in the CSS using the token() function. */
export function resolveAll(config: Config): Array<ResolvedToken> {
  const diagnostics = new Diagnostics()
  const resolved: Array<ResolvedToken> = []

  for (const token of config.tokens) {
    const fn = createVirtualFunction(token)
    const resolvedToken = resolveToken(config, token, fn, diagnostics)

    resolved.push(resolvedToken)
  }

  return resolved
}

/** Resolves a token from a matching token and function call and caches the result. */
function resolveToken(
  config: Config,
  token: Token,
  fn: SnowFunction,
  diagnostics: Diagnostics,
): ResolvedToken {
  const values = resolveValues(config, token, fn, diagnostics)
  const resolved = new ResolvedToken(fn.name, token.path, token.values, values, fn.location)

  return resolved
}

/** Creates the modify context from config. */
function createModifyContext(config: Config): ModifyContext {
  return {
    rootFontSize: config.config.rootFontSize ?? 16,
  }
}

/** Creates a virtual function for a token, used to resolve token values without usage context. */
function createVirtualFunction(token: Token): SnowFunction {
  return new ValueFunction(token.path, null, {
    start: 0,
    end: 0,
  })
}

/** Resolves token values, applying modifier if applicable. */
function resolveValues(
  config: Config,
  token: Token,
  fn: SnowFunction,
  diagnostics: Diagnostics,
): Array<string> {
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
    diagnostics.warning({
      message: `cannot apply modifier to multi-value token '${token.path.toDotPath()}'`,
      context: 'resolver',
    })

    return [token.raw]
  }

  const [value] = token.values
  const ctx = createModifyContext(config)

  return [value.apply(fn.modifier, ctx) ?? token.raw]
}
