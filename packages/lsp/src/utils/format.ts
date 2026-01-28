import type { Config, Token, TokenValue, ValueModifier } from '@snowcss/internal'
import {
  AlphaModifier,
  ColorValue,
  CommaValue,
  NegateModifier,
  PxValue,
  RawValue,
  RemValue,
  UnitModifier,
} from '@snowcss/internal'
import type { MarkupContent } from 'vscode-languageserver'
import { MarkupKind } from 'vscode-languageserver'

interface FormattedValue {
  value: string
  hasComma: boolean
}

const MAX_VALUE_LENGTH = 60

/** Format value with original in comment. */
function withComment(modified: string, original: string): string {
  return `${modified} /* ${original} */`
}

/** Formats the token documentation as a Markdown string. */
export function formatTokenDocumentation(
  token: Token,
  config: Config,
  modifier?: ValueModifier | null,
): MarkupContent {
  const lines: Array<string> = []
  const cssVarName = token.path.toCssVar()

  // Apply modifier if present and applicable.
  let cssVarValue: string

  if (modifier && token.values.length === 1) {
    const [value] = token.values
    cssVarValue = formatValueWithModifier(value, config, modifier)
  } else {
    cssVarValue = formatTokenValues(token, config)
  }

  lines.push('```css')
  lines.push(':root {')
  lines.push(`  ${cssVarName}: ${cssVarValue.trimEnd()};`)
  lines.push('}')
  lines.push('```')

  return {
    kind: MarkupKind.Markdown,
    value: lines.join('\n'),
  }
}

function formatValueWithModifier(
  value: TokenValue,
  config: Config,
  modifier: ValueModifier,
): string {
  const opts = { rootFontSize: config.config.rootFontSize }

  if (value instanceof RemValue) return formatRemWithModifier(value, config, modifier)
  if (value instanceof PxValue) return formatPxWithModifier(value, config, modifier)
  if (value instanceof ColorValue) return formatColorWithModifier(value, modifier)

  // For other values, try to apply modifier or fall back to raw.
  return value.apply(modifier, opts) ?? value.raw
}

function formatRemWithModifier(value: RemValue, config: Config, modifier: ValueModifier): string {
  const opts = { rootFontSize: config.config.rootFontSize }

  // rem → px: show converted value, comment original.
  if (modifier instanceof UnitModifier && modifier.unit === 'px') {
    const pxStr = value.apply(modifier, opts) ?? `${value.parsed * opts.rootFontSize}px`

    return withComment(pxStr, value.raw)
  }

  // Negate rem: show negated rem, comment negated px.
  if (modifier instanceof NegateModifier) {
    const negatedRem = value.apply(modifier, opts) ?? `${-value.parsed}rem`
    const pxValue = value.parsed * opts.rootFontSize
    const negatedPx = `-${pxValue}px`

    return withComment(negatedRem, negatedPx)
  }

  // For other modifiers, apply and show with original in comment.
  const modified = value.apply(modifier, opts)

  if (modified) {
    return withComment(modified, value.raw)
  }

  // Fallback: format as rem without modifier.
  return formatRemValue(value, config)
}

function formatPxWithModifier(value: PxValue, config: Config, modifier: ValueModifier): string {
  const opts = { rootFontSize: config.config.rootFontSize }

  // px → rem: show converted value, comment original.
  if (modifier instanceof UnitModifier && modifier.unit === 'rem') {
    const remStr = value.apply(modifier, opts) ?? `${value.parsed / opts.rootFontSize}rem`

    return withComment(remStr, value.raw)
  }

  // Negate px: just show negated value, no comment.
  if (modifier instanceof NegateModifier) {
    return value.apply(modifier, opts) ?? `${-value.parsed}px`
  }

  // For other modifiers, try to apply.
  return value.apply(modifier, opts) ?? value.raw
}

function formatColorWithModifier(value: ColorValue, modifier: ValueModifier): string {
  if (modifier instanceof AlphaModifier) {
    // Apply alpha: show modified color, comment original.
    const modified = value.apply(modifier, { rootFontSize: 16 })

    if (modified) {
      return withComment(modified, value.raw)
    }
  }

  // For other modifiers, try to apply.
  return value.apply(modifier, { rootFontSize: 16 }) ?? value.raw
}

function formatTokenValues(token: Token, config: Config): string {
  const hasExceededLength = token.raw.length > MAX_VALUE_LENGTH
  let hasComma = false
  let result = ''

  for (let index = 0; index < token.values.length; index++) {
    const current = token.values[index]
    const next = token.values[index + 1]
    const isNextComma = next instanceof CommaValue

    const formatted = formatSingleValue(current, config, isNextComma, hasExceededLength)

    if (formatted.hasComma) {
      hasComma = true
    }

    result += formatted.value
  }

  return hasComma && hasExceededLength ? '\n    ' + result : result
}

function formatSingleValue(
  value: TokenValue,
  config: Config,
  isNextComma: boolean,
  hasExceededLength: boolean,
): FormattedValue {
  const withSpace = (str: string) => (isNextComma ? str : str + ' ')

  if (value instanceof CommaValue) {
    return {
      value: value.raw + (hasExceededLength ? '\n    ' : ' '),
      hasComma: true,
    }
  }

  if (value instanceof RemValue) {
    return {
      value: withSpace(formatRemValue(value, config)),
      hasComma: false,
    }
  }

  if (value instanceof RawValue || value instanceof ColorValue || value instanceof PxValue) {
    return {
      value: withSpace(value.raw),
      hasComma: false,
    }
  }

  return {
    value: '',
    hasComma: false,
  }
}

function formatRemValue(value: RemValue, config: Config): string {
  const opts = { rootFontSize: config.config.rootFontSize }
  const modifier = new UnitModifier('px')
  const pxStr = value.apply(modifier, opts) ?? `${value.parsed * opts.rootFontSize}px`

  return withComment(value.raw, pxStr)
}
