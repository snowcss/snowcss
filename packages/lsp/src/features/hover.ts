import type { Config } from '@snowcss/internal'
import { Path } from '@snowcss/internal'
import type { Hover, HoverParams } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { getCssRegions } from '#parsing'
import { findFunctionAtOffset, formatTokenDocumentation } from '#utils'

/** Handles hover requests. */
export function handleHover(
  params: HoverParams,
  document: TextDocument,
  config: Config,
): Hover | null {
  const text = document.getText()
  const offset = document.offsetAt(params.position)
  const regions = getCssRegions(text, document.languageId)

  // Find the function call at the cursor position.
  const fnCall = findFunctionAtOffset(text, offset, regions)

  if (!fnCall) {
    return null
  }

  // Look up the token.
  const path = Path.fromDotPath(fnCall.path)
  const token = config.getByPath(path)

  if (!token) {
    return null
  }

  const contents = formatTokenDocumentation(token, config, fnCall.modifier)

  return {
    contents,
    range: {
      start: document.positionAt(fnCall.range.start),
      end: document.positionAt(fnCall.range.end),
    },
  }
}
