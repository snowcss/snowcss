import type { Atrule, CssNode, FunctionNode, Raw } from 'css-tree'
import { parse as parseCssTree, walk as walkCssTree } from 'css-tree'

import type { SnowAtRule } from './at-rule'
import { SNOW_ATRULE_NAME, SnowAtRuleParser } from './at-rule'
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

    // Handle Raw nodes inside custom property declarations. css-tree parses custom property
    // values as Raw nodes, so we need to re-parse them to find Snow functions.
    if (node.type === 'Raw' && FUNCTION_NAMES.some((name) => node.value.includes(name))) {
      const extracted = extractFromRaw(node, diagnostics)
      functions.push(...extracted)
    }
  })

  return [functions, diagnostics]
}

/** Extracts Snow functions from a Raw node by re-parsing its value. */
function extractFromRaw(raw: Raw, diagnostics: Diagnostics): Array<SnowFunction> {
  const functions: Array<SnowFunction> = []

  if (!raw.loc) {
    return functions
  }

  // Re-parse the raw value as a CSS value to discover function nodes.
  const valueAst = parseCssTree(raw.value, {
    context: 'value',
    positions: true,
  })

  // The offset where the raw value starts in the original input.
  const baseOffset = raw.loc.start.offset

  walkCssTree(valueAst, (node: CssNode) => {
    if (node.type === 'Function' && FUNCTION_NAMES.includes(node.name)) {
      const parsed = parseWithOffset(node as FunctionNode, baseOffset, diagnostics)

      if (parsed) {
        functions.push(parsed)
      }
    }
  })

  return functions
}

function parse(node: FunctionNode, diagnostics: Diagnostics): SnowFunction | null {
  return parseWithOffset(node, 0, diagnostics)
}

/** Parses a function node with an offset adjustment for locations. */
function parseWithOffset(
  node: FunctionNode,
  baseOffset: number,
  diagnostics: Diagnostics,
): SnowFunction | null {
  if (!node.loc) {
    diagnostics.error({
      message: `missing location for function node '${node.name}'`,
      context: 'extract:parse',
    })

    return null
  }

  const location: Location = {
    start: node.loc.start.offset + baseOffset,
    end: node.loc.end.offset + baseOffset,
  }

  const Parser = node.name === SnowFunctionName.Value ? ValueFunctionParser : TokenFunctionParser

  return new Parser(node, location, diagnostics).parse()
}

/**
 * Extracts all `@snowcss` at-rules from a CSS string.
 *
 * Returns a tuple of the found at-rules and a {@link Diagnostics} object.
 */
export function extractAtRule(input: string): WithDiagnostics<Array<SnowAtRule>> {
  const atRules: Array<SnowAtRule> = []
  const diagnostics = new Diagnostics()

  const ast = parseCssTree(input, {
    context: 'stylesheet',
    positions: true,
  })

  walkCssTree(ast, (node) => {
    if (node.type === 'Atrule' && node.name === SNOW_ATRULE_NAME) {
      const parsed = parseAtRule(node, diagnostics)

      if (parsed) {
        atRules.push(parsed)
      }
    }
  })

  return [atRules, diagnostics]
}

/** Parses an Atrule node into a SnowAtRule. */
function parseAtRule(node: Atrule, diagnostics: Diagnostics): SnowAtRule | null {
  if (!node.loc) {
    diagnostics.error({
      message: `missing location for at-rule '@${node.name}'`,
      context: 'extract:parseAtRule',
    })

    return null
  }

  const location: Location = {
    start: node.loc.start.offset,
    end: node.loc.end.offset,
  }

  return new SnowAtRuleParser(node, location, diagnostics).parse()
}
