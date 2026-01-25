import type { Token } from '@snowcss/internal'
import { ColorValue } from '@snowcss/internal'
import { CompletionItemKind } from 'vscode-languageserver'

/** Checks if a token represents a color value. */
export function isColorToken(token: Token): boolean {
  return token.values.some((value) => value instanceof ColorValue)
}

/** Returns the appropriate LSP completion kind for a token. */
export function getTokenKind(token: Token): CompletionItemKind {
  return isColorToken(token) ? CompletionItemKind.Color : CompletionItemKind.Value
}

/** Extracts the ColorValue from a token if present. */
export function getColorValue(token: Token): ColorValue | null {
  const colorValue = token.values.find((value) => value instanceof ColorValue)
  return colorValue instanceof ColorValue ? colorValue : null
}
