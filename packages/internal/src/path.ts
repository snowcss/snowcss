import { escapeCssVarName } from './utils'

export class Path {
  constructor(readonly segments: Array<string>) {}

  /** Creates a path from a dot-separated string, e.g. 'foo.bar.baz'. */
  static fromDotPath(path: string): Path {
    return new Path(parseDotPath(path))
  }

  /** Serializes the path into a dot-separated string. */
  toDotPath(): string {
    return this.segments.join('.')
  }

  /** Serializes the path into a CSS variable name. */
  toCssVar(): string {
    return `--` + this.segments.map(escapeCssVarName).join('-')
  }

  /** Returns a CSS variable reference. */
  toCssVarRef(): string {
    return `var(${this.toCssVar()})`
  }

  toString(): string {
    return this.toDotPath()
  }
}

/** Checks if a character is a digit (0-9). */
function isDigit(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9'
}

/** Parses a dot-separated path, preserving decimal numbers like '0.5'. */
function parseDotPath(input: string): Array<string> {
  const segments: Array<string> = []
  let current = ''

  for (let idx = 0; idx < input.length; idx++) {
    const char = input[idx]

    if (char === '.') {
      const prev = input[idx - 1]
      const next = input[idx + 1]

      // Dot is a decimal point if between two digits.
      if (isDigit(prev) && isDigit(next)) {
        current += char
      } else {
        segments.push(current.trim())
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current.trim().length) {
    segments.push(current.trim())
  }

  return segments
}
