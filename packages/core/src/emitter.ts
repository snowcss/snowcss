import type { ResolvedToken } from './resolver'

export interface EmitCssOptions {
  /** Whether to minify the emitted CSS. */
  minify?: boolean
}

/** Emits resolved tokens as a CSS string. */
export function emit(tokens: Iterable<ResolvedToken>, options: EmitCssOptions = {}): string | null {
  const lines: Array<string> = []

  for (const token of tokens) {
    const name = token.path.toCssVar()
    const value = token.toCssValue()

    const line = options.minify ? `${name}:${value};` : `  ${name}: ${value};`

    lines.push(line)
  }

  if (lines.length) {
    const vars = options.minify ? lines.join('') : lines.join('\n')
    const css = options.minify ? `:root{${vars}}` : `:root {\n${vars}\n}`

    return css
  }

  return null
}
