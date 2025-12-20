/** Escapes the CSS variable name. */
export function escapeCssVarName(name: string): string {
  return name.replace(/\./g, '\\.')
}

/** Unescapes the CSS variable name. */
export function unescapeCssVarName(name: string): string {
  return name.replace(/\\./g, '.')
}

/** Strips specified characters from both ends of a string. */
export function stripBoth(str: string, chars: string): string {
  return stripEnd(stripStart(str, chars), chars)
}

/** Strips specified characters from the start of a string. */
export function stripStart(str: string, chars: string): string {
  let start = 0

  while (start < str.length && chars.includes(str[start])) {
    start++
  }

  return str.slice(start)
}

/** Strips specified characters from the end of a string. */
export function stripEnd(str: string, chars: string): string {
  let end = str.length

  while (end > 0 && chars.includes(str[end - 1])) {
    end--
  }

  return str.slice(0, end)
}
