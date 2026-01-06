import type { MergeDeep, PartialDeep } from 'type-fest'

import type { Widen } from '@/utils'
import { merge } from '@/utils'

export interface UserTokens {
  [scope: string | number]: string | UserTokens
}

export interface DefineTokens<T> {
  /** Returns the tokens as-is. */
  (): T
  /** Maps the tokens using the provided function. */
  map: <const U extends UserTokens>(fn: (tokens: T) => U) => U
  /** Extends the tokens with the provided values. */
  extend: <const U extends Widen<PartialDeep<T>> | UserTokens>(tokens: U) => MergeDeep<T, U>
}

export function defineTokens<const T extends UserTokens>(tokens: T): DefineTokens<T> {
  const defined: DefineTokens<T> = () => tokens

  defined.map = ((fn) => fn(tokens)) as DefineTokens<T>['map']
  defined.extend = ((extended) => merge(tokens, extended)) as DefineTokens<T>['extend']

  return defined
}
