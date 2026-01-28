import type { SnowFunction, SnowFunctionName, ValueModifier } from '@snowcss/internal'
import { ValueFunction, extract } from '@snowcss/internal'
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
  modifier: ValueModifier | null
  range: Range
}

/** Maps a SnowFunction to FunctionCall, adjusting offset by region start. */
function toFunctionCall(fn: SnowFunction, regionStart: number): FunctionCall {
  return {
    name: fn.name,
    path: fn.path.toDotPath(),
    modifier: fn instanceof ValueFunction ? fn.modifier : null,
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

    try {
      const [functions] = extract(cssContent)

      for (const fn of functions) {
        results.push(toFunctionCall(fn, region.start))
      }
    } catch {}
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
