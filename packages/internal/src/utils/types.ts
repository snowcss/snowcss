import type { SimplifyDeep, UnionToIntersection } from 'type-fest'

/** Given a union type, returns a flattened intersection instead. */
export type Flatten<T> = SimplifyDeep<UnionToIntersection<T>>

/** A type that can be either a value or a promise of a value. */
export type MaybePromise<T> = T | Promise<T>

/** Widens a given literal type to a wider one recursively. */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T extends undefined
            ? undefined
            : T extends null
              ? null
              : { [K in keyof T]: Widen<T[K]> }

/**
 * Extracts all (not only leaf) token paths from a given object type as a union of string literals.
 *
 * @example
 * type Config = { colors: { primary: string } }
 * ExtractPaths<Config> //> "colors" | "colors.primary"
 */
export type ExtractPaths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? T[K] extends object
          ? `${K}` | `${K}.${ExtractPaths<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

/**
 * Extracts only leaf (terminal) token paths from a given object type as a union of string literals.
 *
 * @example
 * type Config = { colors: { primary: string } }
 * ExtractTerminalPaths<Config> //> "colors.primary"
 */
export type ExtractTerminalPaths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? T[K] extends object
          ? `${K}.${ExtractTerminalPaths<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

/**
 * Retrieves the type at the specified path within a nested object type.
 * Supports both string keys and numeric indices.
 *
 * @example
 * type Config = { colors: { primary: string } }
 * GetByPath<Config, ["colors", "primary"]>   //> string
 * GetByPath<Config, ["colors", "secondary"]> //> never
 */
export type GetByPath<T, P extends Array<string>> = P extends [
  infer Head extends string,
  ...infer Tail extends Array<string>,
]
  ? Head extends keyof T
    ? Tail extends []
      ? T[Head]
      : GetByPath<T[Head], Tail>
    : Head extends `${infer N extends number}`
      ? N extends keyof T
        ? Tail extends []
          ? T[N]
          : GetByPath<T[N], Tail>
        : never
      : never
  : never

/**
 * Splits a dot-separated path string into an array of segments.
 * Consecutive numeric segments are kept together (e.g., "1.2" becomes a single segment).
 *
 * @example
 * SplitPath<"colors.primary"> //> ["colors", "primary"]
 * SplitPath<"spacing.1.5">    //> ["spacing", "1.5"]
 * SplitPath<"">               //> []
 */
export type SplitPath<
  P extends string,
  Acc extends Array<string> = [],
> = P extends `${infer A}.${infer B}.${infer Rest}`
  ? A extends `${number}`
    ? B extends `${number}`
      ? SplitPath<Rest, [...Acc, `${A}.${B}`]>
      : SplitPath<`${B}.${Rest}`, [...Acc, A]>
    : SplitPath<`${B}.${Rest}`, [...Acc, A]>
  : P extends `${infer A}.${infer B}`
    ? A extends `${number}`
      ? B extends `${number}`
        ? [...Acc, `${A}.${B}`]
        : [...Acc, A, B]
      : [...Acc, A, B]
    : P extends ''
      ? Acc
      : [...Acc, P]

/**
 * Escapes a dot-separated path segment.
 *
 * @example
 * EscapeCssVarName<"colors.primary"> //> "colors\\.primary"
 */
export type EscapeCssVarName<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? `${Head}\\.${EscapeCssVarName<Tail>}`
  : S

/**
 * Serializes a dot-separated path into a CSS variable name, preserving numeric segments.
 *
 * @example
 * JoinCssVarPath<["colors", "primary"]>        //> "colors-primary"
 * JoinCssVarPath<["colors", "primary", "500"]> //> "colors-primary-500"
 */
export type JoinCssVarPath<S extends Array<string>> = S extends [
  infer Head extends string,
  ...infer Tail extends Array<string>,
]
  ? Tail extends []
    ? EscapeCssVarName<Head>
    : `${EscapeCssVarName<Head>}-${JoinCssVarPath<Tail>}`
  : ''
