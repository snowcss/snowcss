import type { Path } from '@/path'
import { Token } from '@/token'

import type { UnresolvedConfig, UserConfig, UserTokens } from './user'

export class Config {
  /** Returns all tokens as an array. */
  get tokens(): Array<Token> {
    return Array.from(this.index.values())
  }

  constructor(
    public config: UserConfig,
    public path: string,
    private index: Map<string, Token>,
  ) {}

  /** Creates a ready to use config from an unresolved config. */
  static async create(unresolvedConfig: UnresolvedConfig, configPath: string): Promise<Config> {
    const config = await unresolvedConfig()
    const index = Config.createTokenIndex(config)

    return new Config(config, configPath, index)
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
