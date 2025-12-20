import { escapeCssVarName } from '@/utils'

export class Path {
  constructor(public readonly segments: Array<string>) {}

  /** Creates a path from a dot-separated string, e.g. 'foo.bar.baz'. */
  public static fromDotPath(path: string): Path {
    return new Path(path.split('.').map((it) => it.trim()))
  }

  /** Returns a CSS variable name that can be used in a CSS rule. */
  public toCssVar(prefix?: string): string {
    const segments = this.segments.map(escapeCssVarName)
    const varName = [prefix ?? '', ...segments].join('-')
    return `--${varName}`
  }

  /** Returns a CSS variable reference. */
  public toCssVarRef(prefix?: string): string {
    return `var(${this.toCssVar(prefix)})`
  }
}
