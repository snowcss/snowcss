import type { Config, Token } from '@snowcss/internal'
import {
  ColorValue,
  CommaValue,
  PxValue,
  RawValue,
  RemValue,
  UnitModifier,
} from '@snowcss/internal'
import type { MarkupContent } from 'vscode-languageserver'
import { MarkupKind } from 'vscode-languageserver'

const MAX_VALUE_LENGTH = 60

/** Formats the token documentation as a Markdown string. */
export function formatTokenDocumentation(token: Token, config: Config): MarkupContent {
  const lines: Array<string> = []

  const cssVarName = token.path.toCssVar()
  const cssVarValue = formatTokenValues(token, config).trimEnd()

  lines.push('```css')
  lines.push(':root {')
  lines.push(`  ${cssVarName}: ${cssVarValue};`)
  lines.push('}')
  lines.push('```')

  return {
    kind: MarkupKind.Markdown,
    value: lines.join('\n'),
  }
}

function formatTokenValues(token: Token, config: Config): string {
  const hasExceededLength = token.raw.length > MAX_VALUE_LENGTH
  let hasComma = false
  let result = ''

  for (let index = 0; index < token.values.length; index++) {
    const current = token.values[index]
    const next = token.values[index + 1]

    const isNextComma = next && next instanceof CommaValue

    if (current instanceof RawValue) result += withSpace(current.raw, isNextComma)
    if (current instanceof ColorValue) result += withSpace(current.raw, isNextComma)
    if (current instanceof PxValue) result += withSpace(current.raw, isNextComma)

    if (current instanceof RemValue) {
      const converted = current.apply(new UnitModifier('px'), {
        rootFontSize: config.config.rootFontSize,
      })

      result += withSpace(current.raw + ` /* ${converted} */`, isNextComma)
    }

    if (current instanceof CommaValue) {
      hasComma = true
      result += current.raw
      result += hasExceededLength ? '\n    ' : ' '
    }
  }

  return hasComma && hasExceededLength ? '\n    ' + result : result
}

function withSpace(value: string, isNextComma: boolean): string {
  return isNextComma ? value : value + ' '
}
