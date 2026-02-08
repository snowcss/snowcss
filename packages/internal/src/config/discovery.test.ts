import { existsSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { findNearestConfig } from './discovery'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()

  return {
    ...actual,
    existsSync: vi.fn(),
  }
})

/** Sets up which paths should be treated as existing. */
function mockExistingPaths(...paths: Array<string>): void {
  vi.mocked(existsSync).mockImplementation((p) => paths.includes(p as string))
}

describe('findNearestConfig', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReset()
  })

  it('finds config in same directory as file', () => {
    mockExistingPaths('/project/snow.config.ts')
    const result = findNearestConfig('/project/style.css', ['/project'])
    expect(result).toBe('/project/snow.config.ts')
  })

  it('finds config in parent directory', () => {
    mockExistingPaths('/project/snow.config.ts')
    const result = findNearestConfig('/project/src/styles/style.css', ['/project'])
    expect(result).toBe('/project/snow.config.ts')
  })

  it('finds config in intermediate directory', () => {
    mockExistingPaths('/project/src/snow.config.ts')
    const result = findNearestConfig('/project/src/styles/style.css', ['/project'])
    expect(result).toBe('/project/src/snow.config.ts')
  })

  it('returns null when no config found', () => {
    mockExistingPaths()
    const result = findNearestConfig('/project/style.css', ['/project'])
    expect(result).toBeNull()
  })

  it('stops at workspace root', () => {
    mockExistingPaths('/snow.config.ts')
    const result = findNearestConfig('/workspace/project/style.css', ['/workspace'])
    expect(result).toBeNull()
  })

  it('supports multiple workspace roots', () => {
    mockExistingPaths('/workspace2/snow.config.ts')
    const result = findNearestConfig('/workspace2/style.css', ['/workspace1', '/workspace2'])
    expect(result).toBe('/workspace2/snow.config.ts')
  })

  it('prefers config file order (ts before js)', () => {
    mockExistingPaths('/project/snow.config.ts', '/project/snow.config.js')
    const result = findNearestConfig('/project/style.css', ['/project'])
    expect(result).toBe('/project/snow.config.ts')
  })

  it('finds .mts config file', () => {
    mockExistingPaths('/project/snow.config.mts')
    const result = findNearestConfig('/project/style.css', ['/project'])
    expect(result).toBe('/project/snow.config.mts')
  })

  it('finds .cjs config file', () => {
    mockExistingPaths('/project/snow.config.cjs')
    const result = findNearestConfig('/project/style.css', ['/project'])
    expect(result).toBe('/project/snow.config.cjs')
  })

  it('finds nearest config when multiple exist in hierarchy', () => {
    mockExistingPaths('/project/snow.config.ts', '/project/src/snow.config.ts')
    const result = findNearestConfig('/project/src/style.css', ['/project'])
    expect(result).toBe('/project/src/snow.config.ts')
  })

  it('handles empty workspace roots array', () => {
    mockExistingPaths('/project/snow.config.ts')
    const result = findNearestConfig('/project/style.css', [])
    expect(result).toBe('/project/snow.config.ts')
  })

  it('does not find config in sibling directory', () => {
    mockExistingPaths('/project/other/snow.config.ts')
    const result = findNearestConfig('/project/src/style.css', ['/project'])
    expect(result).toBeNull()
  })

  it('does not find config above workspace root when deeply nested', () => {
    mockExistingPaths('/snow.config.ts')
    const result = findNearestConfig('/workspace/a/b/c/d/style.css', ['/workspace'])
    expect(result).toBeNull()
  })

  it('finds config when file path is the config itself', () => {
    mockExistingPaths('/project/snow.config.ts')
    const result = findNearestConfig('/project/snow.config.ts', ['/project'])
    expect(result).toBe('/project/snow.config.ts')
  })
})
