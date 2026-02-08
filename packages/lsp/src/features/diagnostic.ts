import type { Config, Token, TokenValue, ValueModifier } from '@snowcss/internal'
import {
  AlphaModifier,
  ColorValue,
  NegateModifier,
  Path,
  PxValue,
  RawValue,
  RemValue,
  SnowFunctionName,
  UnitModifier,
} from '@snowcss/internal'
import type { Diagnostic } from 'vscode-languageserver'
import { DiagnosticSeverity } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { getCssRegions } from '#parsing'
import type { FunctionCall } from '#utils'
import { findAllFunctions } from '#utils'

const SOURCE = 'snowcss'

/** Returns a human-readable name for a token value type. */
function getValueTypeName(value: TokenValue): string {
  if (value instanceof ColorValue) return 'color'
  if (value instanceof PxValue) return 'px'
  if (value instanceof RemValue) return 'rem'
  if (value instanceof RawValue) return 'raw'

  return 'unknown'
}

/** Returns a human-readable name for a modifier. */
function getModifierName(modifier: ValueModifier): string {
  if (modifier instanceof AlphaModifier) return 'Alpha modifier'
  if (modifier instanceof UnitModifier) return `Unit conversion (to ${modifier.unit})`
  if (modifier instanceof NegateModifier) return 'Negate modifier'

  return 'Modifier'
}

/** Formats the diagnostic message for an incompatible modifier. */
function formatIncompatibleModifier(fn: FunctionCall, token: Token): string {
  const [value] = token.values
  const valueType = getValueTypeName(value)
  // biome-ignore lint/style/noNonNullAssertion: We know the modifier is not null.
  const modifierName = getModifierName(fn.modifier!)

  return `${modifierName} is not compatible with ${valueType} token '${fn.path}'.`
}

/** Computes diagnostics for all Snow CSS function calls in the document. */
export function computeDiagnostics(document: TextDocument, config: Config): Array<Diagnostic> {
  const text = document.getText()
  const regions = getCssRegions(text, document.languageId)
  const functions = findAllFunctions(text, regions)
  const diagnostics: Array<Diagnostic> = []

  const rootFontSize = config.config.rootFontSize

  for (const fn of functions) {
    const path = Path.fromDotPath(fn.path)
    const token = config.getByPath(path)

    // Non-existent token path.
    if (!token) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: document.positionAt(fn.range.start),
          end: document.positionAt(fn.range.end),
        },
        message: `Token '${fn.path}' does not exist.`,
        source: SOURCE,
      })

      continue
    }

    // Only --value() with modifiers needs further validation.
    if (fn.name !== SnowFunctionName.Value || !fn.modifier) {
      continue
    }

    // Modifier on multi-value token.
    if (token.values.length > 1) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: document.positionAt(fn.range.start),
          end: document.positionAt(fn.range.end),
        },
        message: `Cannot apply modifier to multi-value token '${fn.path}'.`,
        source: SOURCE,
      })

      continue
    }

    // Incompatible modifier for single-value token.
    if (token.values.length === 1) {
      const result = token.values[0].apply(fn.modifier, { rootFontSize })

      if (result === null) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: {
            start: document.positionAt(fn.range.start),
            end: document.positionAt(fn.range.end),
          },
          message: formatIncompatibleModifier(fn, token),
          source: SOURCE,
        })
      }
    }
  }

  return diagnostics
}
