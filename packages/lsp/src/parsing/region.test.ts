import { describe, expect, it } from 'vitest'

import { getCssRegions, isInCssRegion } from './region'

describe('getCssRegions', () => {
  describe('pure CSS languages', () => {
    it('returns single region spanning entire document for css', () => {
      const text = 'body { color: red; }'
      const regions = getCssRegions(text, 'css')

      expect(regions).toHaveLength(1)
      expect(regions[0]).toEqual({ start: 0, end: text.length })
    })

    it('returns single region for sass', () => {
      const text = '$primary: blue\n.class\n  color: $primary'
      const regions = getCssRegions(text, 'sass')

      expect(regions).toHaveLength(1)
      expect(regions[0]).toEqual({ start: 0, end: text.length })
    })

    it('returns single region for postcss', () => {
      const text = '@custom-media --small (width >= 400px);'
      const regions = getCssRegions(text, 'postcss')

      expect(regions).toHaveLength(1)
      expect(regions[0]).toEqual({ start: 0, end: text.length })
    })

    it('handles empty CSS document', () => {
      const text = ''
      const regions = getCssRegions(text, 'css')

      expect(regions).toHaveLength(1)
      expect(regions[0]).toEqual({ start: 0, end: 0 })
    })
  })

  describe('markup languages with style blocks', () => {
    it('detects single style block in vue', () => {
      const text = `<template><div></div></template>
<style>
.class { color: red; }
</style>`
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(1)
      // Region starts after <style> tag and ends before </style>.
      const styleContent = '\n.class { color: red; }\n'
      expect(regions[0].end - regions[0].start).toBe(styleContent.length)
    })

    it('detects style block in svelte', () => {
      const text = `<script>let x = 1;</script>
<style>
body { margin: 0; }
</style>
<div>{x}</div>`
      const regions = getCssRegions(text, 'svelte')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('body { margin: 0; }')
    })

    it('detects style block in astro', () => {
      const text = `---
const title = "Hello";
---
<html>
<style>
h1 { font-size: 2rem; }
</style>
</html>`
      const regions = getCssRegions(text, 'astro')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('h1 { font-size: 2rem; }')
    })

    it('detects style block in html', () => {
      const text = `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: sans-serif; }
</style>
</head>
</html>`
      const regions = getCssRegions(text, 'html')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain(
        'body { font-family: sans-serif; }',
      )
    })

    it('detects multiple style blocks', () => {
      const text = `<style>
.first { color: red; }
</style>
<div>content</div>
<style>
.second { color: blue; }
</style>`
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(2)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('.first')
      expect(text.slice(regions[1].start, regions[1].end)).toContain('.second')
    })

    it('handles style tag with attributes', () => {
      const text = '<style scoped lang="scss">\n.class { color: red; }\n</style>'
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('.class { color: red; }')
    })

    it('handles style tag with newline after opening', () => {
      const text = '<style\n>\n.class { color: red; }\n</style>'
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('.class')
    })
  })

  describe('edge cases', () => {
    it('handles unclosed style block', () => {
      const text = '<template></template>\n<style>\n.class { color: red; }'
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(1)
      // Unclosed block extends to end of document.
      expect(regions[0].end).toBe(text.length)
    })

    it('returns empty array for no style blocks', () => {
      const text = '<template><div>Hello</div></template>\n<script>export default {}</script>'
      const regions = getCssRegions(text, 'vue')

      expect(regions).toHaveLength(0)
    })

    it('does not match stylesheet tag', () => {
      const text = '<stylesheet>not css</stylesheet>\n<style>.real { }</style>'
      const regions = getCssRegions(text, 'html')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('.real')
      expect(text.slice(regions[0].start, regions[0].end)).not.toContain('not css')
    })

    it('does not match style-component or similar', () => {
      const text = '<style-loader>ignore</style-loader>\n<style>.valid {}</style>'
      const regions = getCssRegions(text, 'html')

      expect(regions).toHaveLength(1)
      expect(text.slice(regions[0].start, regions[0].end)).toContain('.valid')
    })

    it('handles consecutive style tags', () => {
      const text = '<style>.a {}</style><style>.b {}</style>'
      const regions = getCssRegions(text, 'html')

      expect(regions).toHaveLength(2)
    })

    it('handles empty style tag', () => {
      const text = '<style></style>'
      const regions = getCssRegions(text, 'html')

      expect(regions).toHaveLength(1)
      expect(regions[0].start).toBe(7) // After '>'.
      expect(regions[0].end).toBe(7) // Before '</style>'.
    })
  })

  describe('unknown languages', () => {
    it('returns empty array for javascript', () => {
      const regions = getCssRegions('const x = 1;', 'javascript')
      expect(regions).toHaveLength(0)
    })

    it('returns empty array for typescript', () => {
      const regions = getCssRegions('const x: number = 1;', 'typescript')
      expect(regions).toHaveLength(0)
    })

    it('returns empty array for json', () => {
      const regions = getCssRegions('{"key": "value"}', 'json')
      expect(regions).toHaveLength(0)
    })

    it('returns empty array for unknown language', () => {
      const regions = getCssRegions('some content', 'unknown-lang')
      expect(regions).toHaveLength(0)
    })
  })
})

describe('isInCssRegion', () => {
  it('returns true when offset is inside a region', () => {
    const regions = [{ start: 10, end: 50 }]
    expect(isInCssRegion(regions, 25)).toBe(true)
  })

  it('returns true when offset equals region start', () => {
    const regions = [{ start: 10, end: 50 }]
    expect(isInCssRegion(regions, 10)).toBe(true)
  })

  it('returns true when offset equals region end', () => {
    const regions = [{ start: 10, end: 50 }]
    expect(isInCssRegion(regions, 50)).toBe(true)
  })

  it('returns false when offset is before region', () => {
    const regions = [{ start: 10, end: 50 }]
    expect(isInCssRegion(regions, 5)).toBe(false)
  })

  it('returns false when offset is after region', () => {
    const regions = [{ start: 10, end: 50 }]
    expect(isInCssRegion(regions, 55)).toBe(false)
  })

  it('returns false for empty regions array', () => {
    const regions: Array<{ start: number; end: number }> = []
    expect(isInCssRegion(regions, 25)).toBe(false)
  })

  it('returns true when offset is in any of multiple regions', () => {
    const regions = [
      { start: 10, end: 30 },
      { start: 50, end: 80 },
      { start: 100, end: 150 },
    ]

    expect(isInCssRegion(regions, 25)).toBe(true) // In first.
    expect(isInCssRegion(regions, 65)).toBe(true) // In second.
    expect(isInCssRegion(regions, 125)).toBe(true) // In third.
  })

  it('returns false when offset is between regions', () => {
    const regions = [
      { start: 10, end: 30 },
      { start: 50, end: 80 },
    ]

    expect(isInCssRegion(regions, 40)).toBe(false) // Between regions.
  })
})
