import { type InspectOptions, inspect as inspectUnconfigured } from 'node:util'

/** Executes and times a function and returns the result and the duration in milliseconds. */
export async function timed<T>(fn: () => T | Promise<T>): Promise<[result: T, duration: number]> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()

  return [result, end - start]
}

/** Inspects an object and returns a string representation. */
export function inspect(value: unknown, options?: InspectOptions): string {
  return inspectUnconfigured(value, {
    depth: null,
    colors: true,
    compact: false,
    ...options,
  })
}

/** Logs a value's string representation that is obtained using `inspect`. */
export function log(...values: Array<unknown>): void {
  console.log(...values.map((value) => inspect(value)))
}
