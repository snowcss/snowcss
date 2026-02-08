/** Represents a CSS region in a document. */
export interface CssRegion {
  start: number
  end: number
}

// Language IDs that are pure CSS.
const CSS_LANGUAGES = ['css', 'sass', 'postcss']

// Language IDs that may contain CSS in style blocks.
const MARKUP_LANGUAGES = ['vue', 'svelte', 'astro', 'html']

// Patterns for style block detection (case-insensitive).
const STYLE_OPEN_RE = /<style(?=[\s>]|$)/gi
const STYLE_CLOSE_RE = /<\/style>/gi

/** Returns CSS regions in the document based on language. */
export function getCssRegions(text: string, languageId: string): Array<CssRegion> {
  if (CSS_LANGUAGES.includes(languageId)) {
    return [
      {
        start: 0,
        end: text.length,
      },
    ]
  }

  if (MARKUP_LANGUAGES.includes(languageId)) {
    return findStyleBlocks(text)
  }

  return []
}

/** Checks if offset is inside any CSS region. */
export function insideAnyCssRegion(regions: Array<CssRegion>, offset: number): boolean {
  return regions.some((it) => insideCssRegion(it, offset))
}

/** Checks if offset is inside a given CSS region. */
export function insideCssRegion(region: CssRegion, offset: number): boolean {
  return offset >= region.start && offset <= region.end
}

/** Finds all style block regions in markup text. */
function findStyleBlocks(text: string): Array<CssRegion> {
  const regions: Array<CssRegion> = []

  // Reset regex state for each call.
  STYLE_OPEN_RE.lastIndex = 0

  let openMatch: RegExpExecArray | null

  while ((openMatch = STYLE_OPEN_RE.exec(text)) !== null) {
    // Find the closing '>' of the opening tag.
    const closeAngle = text.indexOf('>', openMatch.index + openMatch[0].length)

    if (closeAngle === -1) {
      break
    }

    const contentStart = closeAngle + 1

    // Find the closing </style> tag.
    STYLE_CLOSE_RE.lastIndex = contentStart
    const closeMatch = STYLE_CLOSE_RE.exec(text)

    if (!closeMatch) {
      // Unclosed style block extends to end.
      regions.push({
        start: contentStart,
        end: text.length,
      })

      break
    }

    regions.push({
      start: contentStart,
      end: closeMatch.index,
    })

    // Continue searching after the closing tag.
    STYLE_OPEN_RE.lastIndex = closeMatch.index + closeMatch[0].length
  }

  return regions
}
