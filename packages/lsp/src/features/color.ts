import type { Config } from '@snowcss/internal'
import { AlphaModifier, Path } from '@snowcss/internal'
import type { ColorInformation } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { getCssRegions } from '#parsing'
import { findAllFunctions, getColorValues, toVscodeColor } from '#utils'

/** Handles document color requests (for inline color decorators). */
export function handleDocumentColor(
  document: TextDocument,
  config: Config,
): Array<ColorInformation> {
  const text = document.getText()
  const regions = getCssRegions(text, document.languageId)
  const colors: Array<ColorInformation> = []
  const functions = findAllFunctions(text, regions)

  for (const fn of functions) {
    const path = Path.fromDotPath(fn.path)
    const token = config.getByPath(path)

    if (!token) {
      continue
    }

    // Extract all color values from the token.
    const colorValues = getColorValues(token)

    for (const colorValue of colorValues) {
      let rgba = colorValue.toRgba()

      // Handle alpha modifier if present.
      if (fn.modifier instanceof AlphaModifier) {
        rgba = {
          ...rgba,
          alpha: fn.modifier.value,
        }
      }

      colors.push({
        color: toVscodeColor(rgba),
        range: {
          start: document.positionAt(fn.range.start),
          end: document.positionAt(fn.range.end),
        },
      })
    }
  }

  return colors
}
