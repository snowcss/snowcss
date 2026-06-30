import type { MergeDeep, PartialDeep } from 'type-fest'

import { Path } from '#path'
import type {
  ExtractPaths,
  ExtractTerminalPaths,
  GetByPath,
  JoinCssVarPath,
  SplitPath,
  Widen,
} from '#utils'
import { merge } from '#utils'

export interface UserTokens {
  [scope: string | number]: string | TokenRef | UserTokens
}

/** Token reference produced for a token path, e.g. `var(--gray-50)`. */
export type TokenRef<P extends Array<string> = Array<string>> = `var(--${JoinCssVarPath<P>})`

/** Output mode for a token lookup: a CSS variable reference or the resolved value. */
export type TokenMode = 'ref' | 'value'

export interface ByPathOptions<As extends TokenMode = TokenMode> {
  /** Whether to return a CSS variable reference or the resolved value. */
  as?: As
}

/** CSS variable reference produced for a token path, e.g. `var(--gray-50)`. */
export type Ref<P extends string> = TokenRef<SplitPath<P>>

/** Resolved value for a token path: the literal for a leaf, the subtree object for a namespace. */
export type Value<T, P extends string> = GetByPath<T, SplitPath<P>>

const byPathOptionsDefaults: Required<ByPathOptions> = {
  as: 'ref',
}

export interface Tokens<T> {
  /** Return all tokens as-is. */
  (): T
  /** Return a CSS variable reference for a token path. */
  <const U extends ExtractTerminalPaths<T>>(path: U, options?: ByPathOptions<'ref'>): Ref<U>
  /** Return the resolved value for a token path. */
  <const U extends ExtractPaths<T>>(path: U, options: ByPathOptions<'value'>): Value<T, U>
  /** Map the tokens using the provided function. */
  map: <const U extends UserTokens>(fn: (tokens: T) => U) => U
  /** Extend the tokens with the provided values. */
  extend: <const U extends Widen<PartialDeep<T>> | UserTokens>(tokens: U) => MergeDeep<T, U>
}

export function defineTokens<const T extends UserTokens>(tokens: T): Tokens<T> {
  const defined = ((path?: ExtractPaths<T>, options?: ByPathOptions) => {
    if (path) {
      return (options?.as ?? byPathOptionsDefaults.as) === 'value'
        ? getValueByPath(path, tokens)
        : getRefByPath(path, tokens)
    }

    return tokens
  }) as Tokens<T>

  defined.map = ((fn) => fn(tokens)) as Tokens<T>['map']
  defined.extend = ((extended) => merge(tokens, extended)) as Tokens<T>['extend']

  return defined
}

function getRefByPath(path: string, tokens: UserTokens): TokenRef {
  if (typeof getValueByPath(path, tokens) !== 'string') {
    throw new Error(
      `Cannot reference namespace "${path}" as a CSS variable; ` +
        `only terminal token paths are allowed. Use { as: 'value' } to read its value.`,
    )
  }

  return Path.fromDotPath(path).toCssVarRef() as TokenRef
}

function getValueByPath(path: string, tokens: UserTokens): UserTokens | string {
  let current: UserTokens | string = tokens

  for (const segment of Path.fromDotPath(path).segments) {
    if (typeof current === 'string') {
      return current
    }

    current = current[segment]
  }

  return current
}
