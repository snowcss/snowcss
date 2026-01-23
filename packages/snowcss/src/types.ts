/**
 * Splits a dot-separated path string into an array of segments.
 * Consecutive numeric segments are kept together (e.g., "1.2" becomes a single segment).
 *
 * @example
 * SplitPath<"colors.primary"> = ["colors", "primary"]
 * SplitPath<"spacing.1.5"> = ["spacing", "1.5"]
 * SplitPath<""> = []
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
 * Retrieves the type at the specified path within a nested object type.
 * Supports both string keys and numeric indices.
 *
 * @example
 * type Config = { colors: { primary: string } }
 * GetByPath<Config, ["colors", "primary"]> = string
 * GetByPath<Config, ["colors", "secondary"]> = never
 */
export type GetByPath<T, Path extends Array<string>> = Path extends [
  infer First extends string,
  ...infer Rest extends Array<string>,
]
  ? First extends keyof T
    ? Rest extends []
      ? T[First]
      : GetByPath<T[First], Rest>
    : First extends `${infer N extends number}`
      ? N extends keyof T
        ? Rest extends []
          ? T[N]
          : GetByPath<T[N], Rest>
        : never
      : never
  : never
