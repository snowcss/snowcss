import type { SnowFunction, SnowFunctionName, ValueModifier } from '@snowcss/internal'
import {
  AlphaModifier,
  NegateModifier,
  UnitModifier,
  ValueFunction,
  extract,
} from '@snowcss/internal'
import type { Position } from 'vscode-languageserver'

import type { CssRegion } from '#parsing'
import { isInCssRegion } from '#parsing'

interface Range {
  start: number
  end: number
}

/** Information about a Snow CSS function call. */
export interface FunctionCall {
  name: SnowFunctionName
  path: string
  modifier: string | null
  range: Range
}

/** Converts a ValueModifier to its string representation. */
function modifierToString(modifier: ValueModifier | null): string | null {
  if (modifier instanceof AlphaModifier) return `/ ${modifier.value * 100}%`
  if (modifier instanceof UnitModifier) return `to ${modifier.unit}`
  if (modifier instanceof NegateModifier) return 'negate'

  return null
}

/** Maps a SnowFunction to FunctionCall, adjusting offset by region start. */
function toFunctionCall(fn: SnowFunction, regionStart: number): FunctionCall {
  const modifier = fn instanceof ValueFunction ? modifierToString(fn.modifier) : null

  return {
    name: fn.name,
    path: fn.path.toDotPath(),
    modifier,
    range: {
      start: fn.location.start + regionStart,
      end: fn.location.end + regionStart,
    },
  }
}

/** Finds all Snow CSS function calls in the given text, filtered to CSS regions. */
export function findAllFunctions(text: string, regions: Array<CssRegion>): Array<FunctionCall> {
  const results: Array<FunctionCall> = []

  for (const region of regions) {
    const cssContent = text.slice(region.start, region.end)
    const [functions] = extract(cssContent)

    for (const fn of functions) {
      results.push(toFunctionCall(fn, region.start))
    }
  }

  return results
}

/** Finds the Snow CSS function call at the given offset, if any. */
export function findFunctionAtOffset(
  text: string,
  offset: number,
  regions: Array<CssRegion>,
): FunctionCall | null {
  // Early exit if offset is not in a CSS region.
  if (!isInCssRegion(regions, offset)) {
    return null
  }

  const functions = findAllFunctions(text, regions)

  for (const fn of functions) {
    if (offset >= fn.range.start && offset <= fn.range.end) {
      return fn
    }
  }

  return null
}

/** Converts a text offset to an LSP Position (line/character). */
export function indexToPosition(text: string, index: number): Position {
  let line = 0
  let character = 0

  for (let idx = 0; idx < index && idx < text.length; idx++) {
    if (text[idx] === '\n') {
      line++
      character = 0
    } else {
      character++
    }
  }

  return { line, character }
}
