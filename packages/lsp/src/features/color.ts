import type { Config } from '@snowcss/internal'
import { Path } from '@snowcss/internal'
import type {
  ColorInformation,
  ColorPresentation,
  ColorPresentationParams,
} from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { getCssRegions } from '#parsing'
import { findAllFunctions, getColorValue, toVscodeColor } from '#utils'

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

    // Check if the token has a color value.
    const colorValue = getColorValue(token)

    if (!colorValue) {
      continue
    }

    // Extract RGBA.
    let rgba = colorValue.toRgba()

    // Handle alpha modifier if present (e.g., "/ 50%").
    if (fn.modifier) {
      const alphaMatch = fn.modifier.match(/\/\s*(\d+)%/)

      if (alphaMatch) {
        rgba = {
          ...rgba,
          alpha: parseInt(alphaMatch[1], 10) / 100,
        }
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

  return colors
}

/** Handles color presentation requests. Returns empty since colors are defined in config. */
export function handleColorPresentation(
  _params: ColorPresentationParams,
  _document: TextDocument,
): Array<ColorPresentation> {
  // Colors are defined in the config, not editable in CSS.
  return []
}
