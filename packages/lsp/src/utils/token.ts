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

/** Extracts all ColorValues from a token. */
export function getColorValues(token: Token): Array<ColorValue> {
  return token.values.filter((value): value is ColorValue => value instanceof ColorValue)
}
