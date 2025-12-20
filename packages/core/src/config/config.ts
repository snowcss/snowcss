import { Token } from '@/token'

import type { UnresolvedConfig, UserConfig, UserTokens } from './user'

export class Config {
  public path: string
  public config: UserConfig
  public tokens: Array<Token> = []

  constructor(options: { config: UserConfig; configPath: string; tokens: Array<Token> }) {
    this.path = options.configPath
    this.config = options.config
    this.tokens = options.tokens
  }

  /** Creates a ready to use config from an unresolved config. */
  public static async create(options: {
    config: UnresolvedConfig
    configPath: string
  }): Promise<Config> {
    const config = await options.config()

    return new Config({
      config,
      configPath: options.configPath,
      tokens: Config.createTokensFromConfig(config),
    })
  }

  /** Creates tokens from a user config. */
  private static createTokensFromConfig(userConfig: UserConfig): Array<Token> {
    interface StackItem {
      tokens: UserTokens
      head: Array<string>
    }

    const stack: Array<StackItem> = [{ tokens: userConfig.tokens, head: [] }]
    const result: Array<Token> = []

    while (stack.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: This pop() is safe and will never boom().
      const { tokens, head } = stack.pop()!

      for (const [key, value] of Object.entries(tokens)) {
        const nextHead = [...head, key]

        if (typeof value === 'string') {
          const name = userConfig.prefix ? [userConfig.prefix, ...nextHead] : nextHead
          const token = Token.from(name, value)

          result.push(token)
        } else {
          stack.push({
            tokens: value,
            head: nextHead,
          })
        }
      }
    }

    return result
  }
}
