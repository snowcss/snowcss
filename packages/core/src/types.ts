/** Represents a (simplified, compared to css-tree's Location) location in the source CSS. */
export interface Location {
  /** Start position of the node. */
  start: number
  /** End position of the node. */
  end: number
}

export interface ToCacheKey<T = unknown> {
  /**
   * Returns a unique key for caching/memoization. Optionally accepts an auxiliary value to use for
   * building the key.
   */
  toCacheKey(aux?: T): string
}
