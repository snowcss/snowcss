import type { Path } from '#path'
import { Token } from '#token'

import type { UserConfig, UserTokens } from './user'

export class Config<C extends UserConfig = UserConfig> {
  /** Returns all tokens as an array. */
  get tokens(): Array<Token> {
    return Array.from(this.index.values())
  }

  constructor(
    public config: C,
    public path: string,
    private index: Map<string, Token>,
  ) {}

  /** Creates a ready to use config from a user config. */
  static create<C extends UserConfig>(userConfig: C, configPath: string): Config<C> {
    const index = Config.createTokenIndex(userConfig)

    return new Config(userConfig, configPath, index)
  }

  /** Returns a token by path (if it exists). */
  getByPath(path: Path): Token | null {
    return this.index.get(path.toDotPath()) ?? null
  }

  /** Creates token index from a user config for constant lookups. */
  private static createTokenIndex(userConfig: UserConfig): Map<string, Token> {
    interface StackItem {
      tokens: UserTokens
      head: Array<string>
    }

    const stack: Array<StackItem> = [{ tokens: userConfig.tokens, head: [] }]
    const index: Map<string, Token> = new Map()

    while (stack.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: This pop() is safe and will never boom().
      const { tokens: userTokens, head } = stack.pop()!

      for (const [key, value] of Object.entries(userTokens)) {
        const nextHead = [...head, key]

        if (typeof value === 'string') {
          const name = userConfig.prefix ? [userConfig.prefix, ...nextHead] : nextHead
          const token = Token.from(name, value)

          index.set(nextHead.join('.'), token)
        } else {
          stack.push({
            tokens: value,
            head: nextHead,
          })
        }
      }
    }

    return index
  }
}
