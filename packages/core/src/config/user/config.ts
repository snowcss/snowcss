import type { MaybePromise } from '@/utils'
import { merge } from '@/utils'

import type { UserTokens } from './tokens'

/** Specifies how to inject the generated CSS variables. */
export type InjectType = 'at-rule' | 'asset' | 'inline'

export type UnresolvedConfig = () => Promise<UserConfig>

export interface InputConfig {
  /**
   * Prefix to use for all tokens. If empty or missing, no prefix is used.
   *
   * @default ''
   */
  prefix?: string

  /**
   * How to inject the generated CSS variables:
   *
   * - `at-rule`: find and replace `@snowcss` at-rule in CSS assets.
   * - `asset`: emit as CSS asset that will be referenced in the `index.html`.
   * - `inline`: emit as inline `<style>` tag that will be injected into the `index.html`.
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
   * - An array of arbitrarily nested objects. Useful when you extend or want to remap tokens.
   *
   * @required
   */
  tokens: UserTokens | Array<UserTokens>
}

export interface UserConfig extends InputConfig {
  inject: InjectType
  rootFontSize: number
  /** Merged design tokens. Any overrides are merged into the parent tokens. */
  tokens: UserTokens
}

export function defineConfig(
  config: MaybePromise<InputConfig> | (() => MaybePromise<InputConfig>),
): UnresolvedConfig {
  return async () => {
    const inputConfig = await (typeof config === 'function' ? config() : config)

    return withDefaults(
      Array.isArray(inputConfig.tokens)
        ? withDefaults({
            ...inputConfig,
            tokens: merge(...inputConfig.tokens),
          })
        : withDefaults(inputConfig),
    )
  }
}

function withDefaults(config: InputConfig): UserConfig {
  config.inject ??= 'asset'
  config.rootFontSize ??= 16

  return config as UserConfig
}
