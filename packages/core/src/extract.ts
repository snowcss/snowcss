import type { FunctionNode } from 'css-tree'
import { parse as parseCssTree, walk as walkCssTree } from 'css-tree'

import type { WithDiagnostics } from './diagnostics'
import { Diagnostics } from './diagnostics'
import type { SnowFunction } from './functions'
import { SnowFunctionName, TokenFunctionParser, ValueFunctionParser } from './functions'
import type { Location } from './types'

/** Valid/used Snow CSS function names. */
const FUNCTION_NAMES: Array<string> = [
  SnowFunctionName.Token,
  SnowFunctionName.Value,
] satisfies Array<SnowFunctionName>

/**
 * Extracts all Snow CSS functions usages from a CSS string.
 *
 * Returns a tuple of the found functions and a {@link Diagnostics} object.
 */
export function extract(input: string): WithDiagnostics<Array<SnowFunction>> {
  const functions: Array<SnowFunction> = []
  const diagnostics = new Diagnostics()

  // Parse the CSS string into a css-tree AST.
  const ast = parseCssTree(input, {
    context: 'stylesheet',
    positions: true,
  })

  // Find function nodes and try to turn them into our functions.
  walkCssTree(ast, (node) => {
    if (node.type === 'Function' && FUNCTION_NAMES.includes(node.name)) {
      const parsed = parse(node, diagnostics)

      if (parsed) {
        functions.push(parsed)
      }
    }
  })

  return [functions, diagnostics]
}

function parse(node: FunctionNode, diagnostics: Diagnostics): SnowFunction | null {
  if (!node.loc) {
    diagnostics.error({
      message: `missing location for function node '${node.name}'`,
      context: 'extract:parse',
    })

    return null
  }

  const location: Location = {
    start: node.loc.start.offset,
    end: node.loc.end.offset,
  }

  const Parser = node.name === SnowFunctionName.Value ? ValueFunctionParser : TokenFunctionParser

  return new Parser(node, location, diagnostics).parse()
}
