import type { ModifierKind } from '@snowcss/internal'
import { SnowFunctionName } from '@snowcss/internal'
import { BackwardScanner, isDigit, isIdentChar, isQuote } from '@snowcss/internal/shared'

/** Cursor context types for Snow CSS function calls. */
export type CursorContext =
  | {
      type: 'path'
      fn: 'token' | 'value'
      prefix: string
      prefixStart: number
      pathEnd: number
      quote: string
    }
  | {
      type: 'modifier'
      path: string
      kind: ModifierKind | null
    }
  | {
      type: 'none'
    }

/**
 * Determines the cursor context for autocompletion by scanning backward from cursor position.
 * Detects if we're inside a --token() or --value() call and what part we're editing.
 */
export function getCursorContext(text: string, offset: number): CursorContext {
  const scanner = new BackwardScanner(text, offset - 1)

  // First, try to detect if we're inside a string (path context).
  const stringResult = tryParseStringContext(text, offset, scanner)

  if (stringResult) {
    return stringResult
  }

  // Reset scanner for modifier context detection.
  scanner.pos = offset - 1

  // Try to detect modifier context (after path, in --value() call).
  const modifierResult = tryParseModifierContext(scanner)

  if (modifierResult) {
    return modifierResult
  }

  return {
    type: 'none',
  }
}

/** Tries to parse string context (cursor inside path string). */
function tryParseStringContext(
  text: string,
  offset: number,
  scanner: BackwardScanner,
): CursorContext | null {
  // Collect any path characters before cursor.
  const prefixChars: Array<string> = []

  while (scanner.hasMore()) {
    const ch = scanner.peek()

    if (isIdentChar(ch)) {
      prefixChars.unshift(scanner.advance())
    } else {
      break
    }
  }

  // Expect opening quote.
  if (!scanner.hasMore() || !isQuote(scanner.peek())) {
    return null
  }

  const openQuote = scanner.advance()

  // Skip optional whitespace after opening paren.
  scanner.skipWhitespace()

  // Expect opening paren.
  if (!scanner.hasMore() || scanner.peek() !== '(') {
    return null
  }

  scanner.advance() // Skip '('.

  // Check for function name.
  const fn = parseFunctionName(scanner)

  if (!fn) {
    return null
  }

  // Check if there's a closing quote ahead (we're editing existing path).
  const pathEnd = findPathEnd(text, offset, openQuote)
  const prefix = prefixChars.join('')
  const prefixStart = offset - prefix.length

  return {
    type: 'path',
    fn,
    prefix,
    prefixStart,
    pathEnd,
    quote: openQuote,
  }
}

/** Tries to parse modifier context (cursor after path string in --value() call). */
function tryParseModifierContext(scanner: BackwardScanner): CursorContext | null {
  // Skip any partial modifier text or whitespace.
  // Could be: "/ 50" (alpha), "to p" (unit), "neg" (negate), or just whitespace.
  let hasSlash = false
  let hasAlphaValue = false

  // Skip digits and % for partial alpha values.
  while (scanner.hasMore() && (isDigit(scanner.peek()) || scanner.peek() === '%')) {
    hasAlphaValue = true
    scanner.advance()
  }

  scanner.skipWhitespace()

  // Check for slash (alpha modifier).
  if (scanner.hasMore() && scanner.peek() === '/') {
    hasSlash = true
    scanner.advance()
    scanner.skipWhitespace()
  }

  // Skip partial keyword (to, negate, px, rem).
  while (scanner.hasMore() && isIdentChar(scanner.peek()) && !isQuote(scanner.peek())) {
    scanner.advance()
  }

  scanner.skipWhitespace()

  // Expect closing quote.
  if (!scanner.hasMore() || !isQuote(scanner.peek())) {
    return null
  }

  const closeQuote = scanner.advance()

  // Collect path.
  const path = scanner.collectUntil(closeQuote)

  if (!path) {
    return null
  }

  // Skip opening quote.
  if (!scanner.hasMore() || scanner.peek() !== closeQuote) {
    return null
  }

  scanner.advance()
  scanner.skipWhitespace()

  // Expect opening paren.
  if (!scanner.hasMore() || scanner.peek() !== '(') {
    return null
  }

  scanner.advance()

  // Check for --value function name (modifiers only apply to --value).
  if (!scanner.skip(SnowFunctionName.Value)) {
    return null
  }

  const kind: ModifierKind | null = hasSlash || hasAlphaValue ? 'alpha' : null

  return {
    type: 'modifier',
    path,
    kind,
  }
}

/** Parses function name (--token or --value) looking backward. */
function parseFunctionName(scanner: BackwardScanner): 'token' | 'value' | null {
  if (scanner.skip(SnowFunctionName.Token)) return 'token'
  if (scanner.skip(SnowFunctionName.Value)) return 'value'

  return null
}

/** Finds the end of path string (position of closing quote or end of line). */
function findPathEnd(text: string, offset: number, openQuote: string): number {
  for (let index = offset; index < text.length; index++) {
    const char = text[index]

    if (char === openQuote) return index
    if (char === '\n') return offset
  }

  return offset
}
