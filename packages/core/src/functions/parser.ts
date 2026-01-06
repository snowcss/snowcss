import type { CssNode, FunctionNode } from 'css-tree'

import type { Diagnostics } from '@/diagnostics'
import { Path } from '@/path'
import type { Location } from '@/types'

import type { SnowFunction } from './index'

export abstract class SnowFunctionParser {
  protected pos = 0
  protected nodes: Array<CssNode>

  constructor(
    /** CSS function node to parse. */
    node: FunctionNode,
    /** Location of the function call in the source. */
    protected location: Location,
    /** Diagnostics to report errors to. */
    protected diagnostics: Diagnostics,
  ) {
    this.nodes = node.children.toArray()
  }

  /** Parses a css-tree function node into a {@link SnowFunction}. */
  abstract parse(): SnowFunction | null

  /** Parses and return the path from the first argument of the function. */
  protected path(): Path | null {
    const node = this.advance()

    if (!node || node.type !== 'String') {
      return this.error('expected a quoted string path as first argument')
    }

    if (node.value.trim().length === 0) {
      return this.error('empty path is not allowed')
    }

    return Path.fromDotPath(node.value)
  }

  /** Advances to the next available node and returns it, or null if at end. */
  protected advance(): CssNode | null {
    if (this.pos >= this.nodes.length) {
      return null
    }

    return this.nodes[this.pos++]
  }

  /** Returns the next node without advancing position, or null if at end. */
  protected peek(): CssNode | null {
    if (this.pos >= this.nodes.length) {
      return null
    }

    return this.nodes[this.pos]
  }

  /** Checks if at the end of the nodes array. */
  protected isAtEnd(): boolean {
    return this.pos >= this.nodes.length
  }

  /** Shorthand for slightly less verbose short-circuiting with error. */
  protected error(message: string): null {
    return this.diagnostics.error({ message, context: 'parser' }), null
  }
}
