import type { MergeDeep, PartialDeep } from 'type-fest'

import type { Widen } from '#utils'
import { merge } from '#utils'

export interface UserTokens {
  [scope: string | number]: string | UserTokens
}

export interface Tokens<T> {
  /** Return the tokens as-is. */
  (): T
  /** Map the tokens using the provided function. */
  map: <const U extends UserTokens>(fn: (tokens: T) => U) => U
  /** Extend the tokens with the provided values. */
  extend: <const U extends Widen<PartialDeep<T>> | UserTokens>(tokens: U) => MergeDeep<T, U>
}

export function defineTokens<const T extends UserTokens>(tokens: T): Tokens<T> {
  const defined: Tokens<T> = () => tokens

  defined.map = ((fn) => fn(tokens)) as Tokens<T>['map']
  defined.extend = ((extended) => merge(tokens, extended)) as Tokens<T>['extend']

  return defined
}
