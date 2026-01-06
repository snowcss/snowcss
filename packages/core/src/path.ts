import { escapeCssVarName } from './utils'

export class Path {
  constructor(readonly segments: Array<string>) {}

  /** Creates a path from a dot-separated string, e.g. 'foo.bar.baz'. */
  static fromDotPath(path: string): Path {
    return new Path(path.split('.').map((it) => it.trim()))
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
