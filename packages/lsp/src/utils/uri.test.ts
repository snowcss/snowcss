import { describe, expect, it } from 'vitest'

import { normalizeFsPath, uriToPath } from './uri'

describe('normalizeFsPath', () => {
  it('converts Windows backslashes to forward slashes', () => {
    expect(normalizeFsPath('C:\\Users\\test\\file.ts')).toBe('C:/Users/test/file.ts')
  })

  it('preserves Unix paths unchanged', () => {
    expect(normalizeFsPath('/Users/test/file.ts')).toBe('/Users/test/file.ts')
  })

  it('handles mixed separators', () => {
    expect(normalizeFsPath('C:\\foo/bar\\baz')).toBe('C:/foo/bar/baz')
  })

  it('handles empty string', () => {
    expect(normalizeFsPath('')).toBe('')
  })

  it('handles multiple consecutive backslashes', () => {
    expect(normalizeFsPath('C:\\\\foo\\\\bar')).toBe('C://foo//bar')
  })
})

describe('uriToPath', () => {
  it('converts file:// URI to Unix path', () => {
    expect(uriToPath('file:///Users/test/file.ts')).toBe('/Users/test/file.ts')
  })

  it('converts file:// URI with Windows path', () => {
    const result = uriToPath('file:///c:/Users/test/file.ts')
    expect(result).toBe('c:/Users/test/file.ts')
  })

  it('returns null for http:// URIs', () => {
    expect(uriToPath('http://example.com/file.ts')).toBeNull()
  })

  it('returns null for https:// URIs', () => {
    expect(uriToPath('https://example.com/file.ts')).toBeNull()
  })

  it('returns null for data: URIs', () => {
    expect(uriToPath('data:text/plain;base64,SGVsbG8=')).toBeNull()
  })

  it('returns null for mailto: URIs', () => {
    expect(uriToPath('mailto:test@example.com')).toBeNull()
  })

  it('handles URI with encoded characters', () => {
    expect(uriToPath('file:///Users/test/my%20file.ts')).toBe('/Users/test/my file.ts')
  })
})
