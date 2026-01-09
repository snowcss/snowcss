import type { Location } from '#types'

/** Represents raw content before the at-rule's block or semicolon. */
export interface SnowAtRulePrelude {
  /** Raw prelude content as string. */
  raw: string
}

/** Represents raw content inside the at-rule's block. */
export interface SnowAtRuleBlock {
  /** Raw block content as string. */
  raw: string
}

/** Represents a `@snowcss` at-rule in the source CSS. */
export class SnowAtRule {
  constructor(
    /** Location of the at-rule in the source. */
    readonly location: Location,
    /** Optional prelude (content between @snowcss and ; or {). */
    readonly prelude: SnowAtRulePrelude | null = null,
    /** Optional block (content inside { }). */
    readonly block: SnowAtRuleBlock | null = null,
  ) {}
}
