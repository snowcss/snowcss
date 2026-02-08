import { SnowFunctionName } from '#functions/constants'

import { BackwardScanner, isIdentChar, isQuote } from './scanner.ts'

/**
 * Checks if a cursor position is inside a `--token()` or `--value()` path string.
 * Used for triggering autocompletion in editors.
 */
export function isInsidePath(text: string, offset: number): boolean {
  const scanner = new BackwardScanner(text, offset - 1)

  // Skip any path characters before cursor.
  while (scanner.hasMore() && isIdentChar(scanner.peek())) {
    scanner.advance()
  }

  // Expect opening quote.
  if (!scanner.hasMore() || !isQuote(scanner.peek())) {
    return false
  }

  const openQuote = scanner.advance()

  // Skip optional whitespace after opening paren.
  scanner.skipWhitespace()

  // Expect opening paren.
  if (!scanner.hasMore() || scanner.peek() !== '(') {
    return false
  }

  scanner.advance()

  // Check for --token or --value function name.
  if (!scanner.skip(SnowFunctionName.Token) && !scanner.skip(SnowFunctionName.Value)) {
    return false
  }

  // Verify there's a closing quote ahead on the same line.
  const lineEnd = text.indexOf('\n', offset)
  const restOfLine = lineEnd === -1 ? text.slice(offset) : text.slice(offset, lineEnd)

  return restOfLine.includes(openQuote)
}
