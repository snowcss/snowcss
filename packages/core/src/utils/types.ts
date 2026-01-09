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
