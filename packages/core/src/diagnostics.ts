/** Severity level for diagnostics. */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/** Tuple of a value and associated diagnostics. */
export type WithDiagnostics<T> = [value: T, diagnostics: Diagnostics]

/** Input for creating a diagnostic message. */
export interface DiagnosticInput {
  message: string
  context?: string
}

/** A diagnostic message with severity, optional context, and human-readable message. */
export class Diagnostic {
  constructor(
    readonly severity: DiagnosticSeverity,
    readonly message: string,
    readonly context?: string,
  ) {}
}

export class Diagnostics implements Iterable<Diagnostic> {
  private items: Array<Diagnostic> = []

  /** Returns all collected diagnostic messages. */
  get all(): Array<Diagnostic> {
    return this.items
  }

  /** Returns the number of collected diagnostics. */
  get size(): number {
    return this.items.length
  }

  /** Returns true if any error-level diagnostics exist. */
  get hasErrors(): boolean {
    return this.items.some((it) => it.severity === 'error')
  }

  /** Adds a diagnostic with the given severity and input. */
  add(severity: DiagnosticSeverity, input: string | DiagnosticInput): this {
    const options = typeof input === 'string' ? { message: input } : input
    const diagnostic = new Diagnostic(severity, options.message, options.context)

    this.items.push(diagnostic)

    return this
  }

  /** Merges this diagnostics object with another one. */
  merge(diagnostics: Diagnostics): this {
    this.items.push(...diagnostics.all)
    return this
  }

  /** Adds a warning diagnostic. */
  warning(input: string | DiagnosticInput): this {
    this.add('warning', input)
    return this
  }

  /** Adds an error diagnostic. */
  error(input: string | DiagnosticInput): this {
    this.add('error', input)
    return this
  }

  /** Clears all diagnostics. */
  clear(): this {
    this.items = []
    return this
  }

  [Symbol.iterator](): Iterator<Diagnostic> {
    return this.items[Symbol.iterator]()
  }
}
