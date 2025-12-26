import type { CssNode, FunctionNode } from 'css-tree'
import { findAll, parse } from 'css-tree'

import { Path } from '@/path'

import type { SnowFunction, ValueModifier } from './functions'
import { TokenFunction, ValueFunction } from './functions'

/** Valid/used Snow CSS function names. */
const FUNCTION_NAMES = [TokenFunction.cssFunctionName, ValueFunction.cssFunctionName]

export class Parser {
  private pos: number = 0
  private nodes: Array<CssNode> = []

  constructor(private input: string) {}

  /** Given a CSS string, returns a list of all Snow CSS function usages. */
  public static fromCss(input: string): Parser {
    return new Parser(input)
  }

  public parse(): Array<SnowFunction> {
    const functions: Array<SnowFunction> = []

    // Parse the CSS string into a CSS AST.
    const ast = parse(this.input, {
      context: 'stylesheet',
      positions: true,
    })

    // Find all function nodes in the AST.
    const functionNodes = findAll(
      ast,
      (node) => node.type === 'Function' && FUNCTION_NAMES.includes(node.name),
    ) as Array<FunctionNode>

    // If there are any function nodes, parse them.
    if (functionNodes.length) {
      for (const node of functionNodes) {
        const parsed = this.parseNode(node)

        if (parsed) {
          functions.push(parsed)
        }
      }
    }

    return functions
  }

  /** Loads the given function node to parse and resets the position. */
  private parseNode(node: FunctionNode): SnowFunction {
    this.nodes = node.children.toArray()
    this.pos = 0

    return node.name === ValueFunction.cssFunctionName ? this.value() : this.token()
  }

  /** Parses a value() CSS function call. */
  private value(): ValueFunction {
    const path = this.path()
    const modifier = this.valueModifier()

    return new ValueFunction(path, modifier)
  }

  /** Parses a token() CSS function call. */
  private token(): TokenFunction {
    const path = this.path()

    return new TokenFunction(path)
  }

  /** Parses the token path string. */
  private path(): Path {
    const node = this.expect('String', 'Expected a quoted string path as first argument')
    return Path.fromDotPath(node.value)
  }

  /** Parses optional value() modifiers: `to <unit>` or `/ <percentage>`. */
  private valueModifier(): ValueModifier | null {
    if (this.isAtEnd()) {
      return null
    }

    const node = this.peek()

    // Handle `to <unit>` modifier.
    if (node.type === 'Identifier' && node.name === 'to') {
      this.advance()

      const unit = this.expect('Identifier', 'Expected unit identifier after "to": px, rem')

      if (unit.name !== 'px' && unit.name !== 'rem') {
        throw new Error(`Unexpected unit "${unit.name}", expected "px" or "rem"`)
      }

      return {
        type: 'unit',
        unit: unit.name,
      }
    }

    // Handle `/ <percentage>` modifier.
    if (node.type === 'Operator' && node.value === '/') {
      this.advance()

      const percent = this.expect('Percentage', 'Expected percentage value after "/"')
      const value = parseFloat(percent.value) / 100

      return {
        type: 'alpha',
        value,
      }
    }

    throw new Error(`Unexpected value() modifier`)
  }

  /** Advances to the next available node and returns it. */
  private advance(): CssNode {
    return this.nodes[this.pos++] ?? this.nodes[this.nodes.length - 1]
  }

  /** Returns the next node without advancing position. */
  private peek(): CssNode {
    return this.nodes[this.pos] ?? this.nodes[this.nodes.length - 1]
  }

  /** Expects and consumes a specific node type, throwing if not found. */
  private expect<T extends CssNode['type'], R = Extract<CssNode, { type: T }>>(
    type: T,
    message?: string,
  ): R {
    const node = this.advance()

    if (node.type !== type) {
      throw new Error(
        message ??
          `Expected node to be of type ${type.toLowerCase()}, got ${node.type.toLowerCase()}`,
      )
    }

    return node as R
  }

  /** Checks if at the end of the nodes array. */
  private isAtEnd(): boolean {
    return this.pos >= this.nodes.length
  }
}
