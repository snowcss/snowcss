import type { Flatten, MaybePromise } from '#utils'
import { merge } from '#utils'

import type { UserTokens } from './tokens'

/** Specifies how to inject the generated CSS variables. */
export type InjectType = 'at-rule' | 'asset' | 'inline'

export interface InputConfig<T extends UserTokens = UserTokens> {
  /**
   * Prefix to use for all tokens. If empty or missing, no prefix is used.
   *
   * @default ''
   */
  prefix?: string

  /**
   * How to inject the generated CSS variables:
   *
   * - `at-rule`: find and replace the `@snowcss` at-rule in a CSS file. Works in any framework.
   * - `asset`: emit a CSS asset linked from `index.html`. SPA-only (needs an `index.html`).
   * - `inline`: emit an inline `<style>` tag in `index.html`. SPA-only (needs an `index.html`).
   *
   * `asset` and `inline` rely on Vite's `transformIndexHtml` hook and silently do nothing in Astro
   * or SvelteKit, which have no `index.html`. In those apps import `snowcss/tokens.css` to deliver
   * tokens, or use `at-rule` to expand an `@snowcss` marker in a CSS file.
   *
   * @default 'asset'
   */
  inject?: InjectType

  /**
   * Root font size in pixels for rem/px conversion.
   *
   * @default 16
   */
  rootFontSize?: number

  /**
   * The design tokens. Can be either:
   *
   * - A single, arbitrarily nested object. Useful when you just want to define tokens ad-hoc.
   * - An array of arbitrarily nested objects. Useful when you extend or want to remap different
   *   sets of tokens.
   *
   * @required
   */
  tokens: T | Array<T>
}

export interface UserConfig<T extends UserTokens = UserTokens> {
  prefix?: string
  inject: InjectType
  rootFontSize: number
  tokens: T
}

export async function defineConfig<const T extends UserTokens>(
  config: MaybePromise<InputConfig<T>> | (() => MaybePromise<InputConfig<T>>),
): Promise<UserConfig<Flatten<T>>> {
  const inputConfig = await (typeof config === 'function' ? config() : config)

  const tokens = Array.isArray(inputConfig.tokens)
    ? (merge(...inputConfig.tokens) as T)
    : inputConfig.tokens

  return {
    prefix: inputConfig.prefix,
    inject: inputConfig.inject ?? 'asset',
    rootFontSize: inputConfig.rootFontSize ?? 16,
    tokens: tokens as Flatten<T>,
  }
}
