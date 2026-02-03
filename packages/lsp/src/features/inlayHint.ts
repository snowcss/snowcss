import type { Config } from '@snowcss/internal'
import { Path } from '@snowcss/internal'
import type { InlayHint, InlayHintParams } from 'vscode-languageserver'
import { InlayHintKind } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { getCssRegions } from '#parsing'
import { findAllFunctions, getRemValue } from '#utils'

const MAX_HINT_LENGTH = 30

/** Truncates a string to the given length, appending ellipsis if needed. */
function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() + '\u2026' : value.trim()
}

/** Handles inlay hint requests. */
export function handleInlayHint(
  params: InlayHintParams,
  document: TextDocument,
  config: Config,
): Array<InlayHint> {
  const text = document.getText()
  const regions = getCssRegions(text, document.languageId)
  const functions = findAllFunctions(text, regions)
  const hints: Array<InlayHint> = []

  const rangeStart = document.offsetAt(params.range.start)
  const rangeEnd = document.offsetAt(params.range.end)
  const rootFontSize = config.config.rootFontSize

  for (const fn of functions) {
    // Skip functions outside the requested range.
    if (fn.range.end < rangeStart || fn.range.start > rangeEnd) {
      continue
    }

    const path = Path.fromDotPath(fn.path)
    const token = config.getByPath(path)

    if (!token) {
      continue
    }

    let label: string | null = null

    // When a modifier is present and the token has a single value, apply it.
    if (fn.modifier && token.values.length === 1) {
      const applied = token.values[0].apply(fn.modifier, { rootFontSize })

      if (applied) {
        label = truncate(applied, MAX_HINT_LENGTH)
      }
    } else {
      const remValue = getRemValue(token)

      // Rem-to-px hint takes precedence for single-rem tokens.
      if (remValue) {
        label = `${remValue.parsed * rootFontSize}px`
      } else {
        label = truncate(token.raw, MAX_HINT_LENGTH)
      }
    }

    if (label) {
      hints.push({
        position: document.positionAt(fn.range.end),
        label: ` ${label}`,
        kind: InlayHintKind.Parameter,
        paddingLeft: false,
        paddingRight: false,
      })
    }
  }

  return hints
}
