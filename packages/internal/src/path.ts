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
  input = input.trim()

  if (input.length === 0) return []
  if (!input.includes('.')) return [input]

  const segments: Array<string> = []
  const parts = input.split('.')

  for (let index = 0, size = parts.length; index < size; index++) {
    let segment = parts[index]

    while (index + 1 < size && isDigit(segment) && isDigit(parts[index + 1])) {
      segment += '.' + parts[++index]
    }

    segments.push(segment.trim())
  }

  return segments
}
