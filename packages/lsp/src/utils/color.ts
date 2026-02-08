import type { RgbaColor } from '@snowcss/internal'
import type { Color } from 'vscode-languageserver'

/** Converts an RGBA color object to an LSP Color. */
export function toVscodeColor(rgba: RgbaColor): Color {
  return {
    red: rgba.r,
    green: rgba.g,
    blue: rgba.b,
    alpha: rgba.alpha,
  }
}
