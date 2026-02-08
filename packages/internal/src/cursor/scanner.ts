/** Backward scanner for parsing CSS function calls from cursor position. */
export class BackwardScanner {
  constructor(
    private readonly text: string,
    public pos: number,
  ) {}

  /** Returns true if scanner has more characters to read. */
  hasMore(): boolean {
    return this.pos >= 0
  }

  /** Returns character at current position without advancing. */
  peek(): string {
    return this.text[this.pos] ?? ''
  }

  /** Returns character at current position and moves backward. */
  advance(): string {
    return this.text[this.pos--] ?? ''
  }

  /** Skips whitespace characters, moving backward. */
  skipWhitespace(): void {
    while (this.hasMore() && isWhitespace(this.peek())) {
      this.pos--
    }
  }

  /**
   * Collects characters backward until reaching target char. Returns collected string in forward
   * order.
   */
  collectUntil(target: string): string {
    let result = ''

    while (this.hasMore() && this.peek() !== target) {
      result = this.advance() + result
    }

    return result
  }

  /**
   * Collects characters backward while predicate is true. Returns collected string in forward
   * order.
   */
  collectWhile(predicate: (ch: string) => boolean): string {
    let result = ''

    while (this.hasMore() && predicate(this.peek())) {
      result = this.advance() + result
    }

    return result
  }

  /** Checks if the text at current position matches expected string (looking backward). */
  matches(expected: string): boolean {
    const start = this.pos - expected.length + 1

    if (start < 0) {
      return false
    }

    return this.text.slice(start, this.pos + 1) === expected
  }

  /** Skips expected string if it matches. Returns true if matched and skipped. */
  skip(expected: string): boolean {
    if (this.matches(expected)) {
      this.pos -= expected.length
      return true
    }

    return false
  }
}

/** Checks if character is whitespace. */
export function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
}

/** Checks if character is a quote. */
export function isQuote(ch: string): boolean {
  return ch === '"' || ch === "'"
}

/** Checks if character is a digit. */
export function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

/** Checks if character is an alphabetic character. */
export function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
}

/** Checks if character is alphanumeric, underscore, dash, or dot. */
export function isIdentChar(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch) || ch === '_' || ch === '-' || ch === '.'
}
