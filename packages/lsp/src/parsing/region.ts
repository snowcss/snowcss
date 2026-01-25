/** Represents a CSS region in a document. */
export interface CssRegion {
  start: number
  end: number
}

/** Result of finding a style tag opening. */
interface StyleOpenResult {
  contentStart: number
}

// Language IDs that are pure CSS.
const CSS_LANGUAGES = ['css', 'sass', 'postcss']

// Language IDs that may contain CSS in style blocks.
const MARKUP_LANGUAGES = ['vue', 'svelte', 'astro', 'html']

// Opening and closing tags for style blocks.
const STYLE_OPEN = '<style'
const STYLE_CLOSE = '</style>'

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
export function isInCssRegion(regions: Array<CssRegion>, offset: number): boolean {
  return regions.some((r) => offset >= r.start && offset <= r.end)
}

/** Finds all style block regions in markup text. */
function findStyleBlocks(text: string): Array<CssRegion> {
  const regions: Array<CssRegion> = []
  let pos = 0

  while (pos < text.length) {
    const openResult = findStyleOpen(text, pos)

    if (!openResult) {
      break
    }

    const closePos = text.indexOf(STYLE_CLOSE, openResult.contentStart)

    if (closePos === -1) {
      // Unclosed style block extends to end.
      regions.push({
        start: openResult.contentStart,
        end: text.length,
      })

      break
    }

    regions.push({
      start: openResult.contentStart,
      end: closePos,
    })

    pos = closePos + STYLE_CLOSE.length
  }

  return regions
}

/** Finds opening style tag and returns position after the closing '>'. */
function findStyleOpen(text: string, startPos: number): StyleOpenResult | null {
  // Find '<style' (case-insensitive for HTML).
  let pos = startPos

  while (pos < text.length) {
    const idx = text.indexOf(STYLE_OPEN, pos)

    if (idx === -1) {
      return null
    }

    // Check it's not '<stylesheet' or similar.
    const afterStyle = text[idx + 6]

    if (afterStyle && afterStyle !== '>' && afterStyle !== ' ' && afterStyle !== '\n') {
      pos = idx + 1
      continue
    }

    // Find the closing '>' of the opening tag.
    const closeAngle = text.indexOf('>', idx + 6)

    if (closeAngle === -1) {
      return null
    }

    return {
      contentStart: closeAngle + 1,
    }
  }

  return null
}
