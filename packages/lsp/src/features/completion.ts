import type { Config } from '@snowcss/internal'
import { SnowFunctionName } from '@snowcss/internal'
import { isQuote, isWhitespace } from '@snowcss/internal/shared'
import type { CompletionItem, CompletionList, CompletionParams, Range } from 'vscode-languageserver'
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import type { CssRegion } from '#parsing'
import { getCssRegions, getCursorContext, isInCssRegion } from '#parsing'
import { formatTokenDocumentation, getTokenKind, isColorToken } from '#utils'

// Empty completion result.
const EMPTY_COMPLETION_LIST: CompletionList = {
  isIncomplete: false,
  items: [],
}

// Static modifier completions.
const MODIFIER_COMPLETIONS: Array<CompletionItem> = [
  {
    label: 'to px',
    kind: CompletionItemKind.Keyword,
    detail: 'Convert to pixels',
    insertText: 'to px',
  },
  {
    label: 'to rem',
    kind: CompletionItemKind.Keyword,
    detail: 'Convert to rem',
    insertText: 'to rem',
  },
  {
    label: 'negate',
    kind: CompletionItemKind.Keyword,
    detail: 'Negate the value',
    insertText: 'negate',
  },
  {
    label: '/',
    kind: CompletionItemKind.Operator,
    detail: 'Alpha modifier (e.g., / 50%)',
    insertText: '/ ',
  },
]

// Static alpha percentage completion items (5% to 100% in 5% increments).
const ALPHA_COMPLETIONS: Array<CompletionItem> = Array.from({ length: 20 }, (_, index) => {
  const value = (index + 1) * 5

  return {
    label: `${value}%`,
    kind: CompletionItemKind.Value,
    detail: `Alpha ${value / 100}`,
    insertText: ` ${value}%`,
  }
})

// Static function name completions.
const FUNCTION_COMPLETIONS: Array<{ label: string; detail: string; fnName: string }> = [
  {
    label: '--token()',
    detail: 'Reference token as CSS variable',
    fnName: SnowFunctionName.Token,
  },
  {
    label: '--value()',
    detail: 'Inline token value with optional modifiers',
    fnName: SnowFunctionName.Value,
  },
]

/** Handles completion requests. */
export function handleCompletion(
  params: CompletionParams,
  document: TextDocument,
  config: Config,
): CompletionList {
  const text = document.getText()
  const offset = document.offsetAt(params.position)

  // Check if we're in a CSS context.
  const regions = getCssRegions(text, document.languageId)

  if (!isInCssRegion(regions, offset)) {
    return EMPTY_COMPLETION_LIST
  }

  const ctx = getCursorContext(text, offset)

  switch (ctx.type) {
    case 'path': {
      // Include closing quote in range to place cursor outside quotes after completion.
      const range = {
        start: document.positionAt(ctx.prefixStart),
        end: document.positionAt(ctx.pathEnd + 1),
      }

      return {
        isIncomplete: false,
        items: getTokenPathCompletions(config, range, ctx.quote),
      }
    }

    case 'modifier':
      return {
        isIncomplete: false,
        items: ctx.kind === 'alpha' ? getAlphaCompletions() : getModifierCompletions(),
      }

    case 'function': {
      const range = {
        start: document.positionAt(ctx.prefixStart),
        end: document.positionAt(offset),
      }

      const quote = inferQuoteStyle(text, regions)

      return {
        isIncomplete: false,
        items: getFunctionCompletions(ctx.prefix, range, quote),
      }
    }

    case 'none':
      return EMPTY_COMPLETION_LIST
  }
}

/** Returns completion items for token paths. */
function getTokenPathCompletions(
  config: Config,
  range: Range,
  quote: string,
): Array<CompletionItem> {
  const items: Array<CompletionItem> = []

  for (const token of config.tokens) {
    const dotPath = token.path.toDotPath()

    // Add terminal token completion.
    // Including closing quote to place cursor outside quotes after completion.
    items.push({
      label: dotPath,
      kind: getTokenKind(token),
      detail: token.path.toCssVar(),
      filterText: dotPath,
      documentation: isColorToken(token) ? token.raw : formatTokenDocumentation(token, config),
      textEdit: {
        range,
        newText: dotPath + quote,
      },
    })
  }

  return items
}

/** Returns completion items for --value() modifiers. */
function getModifierCompletions(): Array<CompletionItem> {
  return MODIFIER_COMPLETIONS
}

/** Returns completion items for alpha percentages. */
function getAlphaCompletions(): Array<CompletionItem> {
  return ALPHA_COMPLETIONS
}

/** Returns completion items for Snow function names. */
function getFunctionCompletions(
  prefix: string,
  range: Range,
  quote: string,
): Array<CompletionItem> {
  return FUNCTION_COMPLETIONS.filter((item) => item.fnName.startsWith(prefix)).map((item) => ({
    label: item.label,
    kind: CompletionItemKind.Function,
    detail: item.detail,
    filterText: item.label,
    insertTextFormat: InsertTextFormat.Snippet,
    textEdit: {
      range,
      newText: `${item.fnName}(${quote}$0${quote})`,
    },
  }))
}

/** Infers quote style from existing Snow functions in CSS regions. */
function inferQuoteStyle(text: string, regions: Array<CssRegion>): string {
  const functions = [`${SnowFunctionName.Token}(`, `${SnowFunctionName.Value}(`]

  for (const region of regions) {
    const content = text.slice(region.start, region.end)

    for (const fn of functions) {
      const idx = content.indexOf(fn)

      if (idx === -1) {
        continue
      }

      // Skip whitespace after opening paren.
      let pos = idx + fn.length

      while (pos < content.length && isWhitespace(content[pos])) {
        pos++
      }

      // Check for quote character.
      const char = content[pos]

      if (isQuote(char)) {
        return char
      }
    }
  }

  return '"'
}
