import type {
  Config,
  EmitCssOptions,
  LoadConfigOptions,
  ResolvedToken,
  SnowAtRule,
  WithDiagnostics,
} from '@snowcss/core'
import { emit, extract, extractAtRule, loadConfig, resolve, resolveAll } from '@snowcss/core'

interface CreateContextOptions extends LoadConfigOptions {}

export class Context {
  private collected: Map<string, ResolvedToken> = new Map()

  constructor(public config: Config) {}

  static async create(options: CreateContextOptions): Promise<Context> {
    const config = await loadConfig(options)
    const context = new Context(config)

    return context
  }

  collect(input: string): WithDiagnostics<Array<ResolvedToken>> {
    const [extracted, extractedDiagnostics] = extract(input)
    const [resolved, resolvedDiagnostics] = resolve(this.config, extracted)

    for (const token of resolved) {
      if (token.isToken) {
        this.collected.set(token.path.toDotPath(), token)
      }
    }

    return [resolved, extractedDiagnostics.merge(resolvedDiagnostics)]
  }

  collectAtRule(input: string): WithDiagnostics<Array<SnowAtRule>> {
    return extractAtRule(input)
  }

  replace(input: string, resolved: Array<ResolvedToken>): string {
    const values = resolved.sort((a, b) => b.location.end - a.location.end)

    for (const token of values) {
      const { start, end } = token.location
      const replacement = token.toCss()

      input = input.slice(0, start) + replacement + input.slice(end)
    }

    return input
  }

  /** Replaces a single at-rule in the input string using its location offsets. */
  replaceAtRule(input: string, atRule: SnowAtRule, replacement: string): string {
    const { start, end } = atRule.location
    return input.slice(0, start) + replacement + input.slice(end)
  }

  emitAllCss(options: EmitCssOptions = {}): string | null {
    return emit(resolveAll(this.config), options)
  }

  emitCss(options: EmitCssOptions = {}): string | null {
    return emit(this.collected.values(), options)
  }
}
