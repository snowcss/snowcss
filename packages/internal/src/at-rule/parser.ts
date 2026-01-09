import type { Atrule } from 'css-tree'
import { generate } from 'css-tree'

import type { Diagnostics } from '#diagnostics'
import type { Location } from '#types'

import type { SnowAtRuleBlock, SnowAtRulePrelude } from './at-rule'
import { SnowAtRule } from './at-rule'

export const SNOW_ATRULE_NAME = 'snowcss'

export class SnowAtRuleParser {
  constructor(
    /** CSS at-rule node to parse. */
    private node: Atrule,
    /** Location of the at-rule in the source. */
    private location: Location,
    /** Diagnostics to report errors to. */
    private diagnostics: Diagnostics,
  ) {}

  /** Parses a css-tree Atrule node into a {@link SnowAtRule}. */
  parse(): SnowAtRule | null {
    const prelude = this.prelude()
    const block = this.block()

    return new SnowAtRule(this.location, prelude, block)
  }

  /** Parses the at-rule prelude (content between @snowcss and ; or {). */
  private prelude(): SnowAtRulePrelude | null {
    if (!this.node.prelude) {
      return null
    }

    return {
      raw: generate(this.node.prelude),
    }
  }

  /** Parses the at-rule block (content inside { }). */
  private block(): SnowAtRuleBlock | null {
    if (!this.node.block) {
      return null
    }

    return {
      raw: generate(this.node.block),
    }
  }

  /** Shorthand for error reporting. */
  private error(message: string): null {
    return this.diagnostics.error({ message, context: 'at-rule:parser' }), null
  }
}
