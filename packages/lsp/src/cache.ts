import { dirname } from 'node:path'

import type { Config } from '@snowcss/internal'
import { findNearestConfig, loadConfig } from '@snowcss/internal'
import type { Connection } from 'vscode-languageserver'

import { normalizeFsPath, uriToPath } from './utils'

/** Caches loaded Snow configs keyed by config file path. */
export class ConfigCache {
  private cache = new Map<string, Config>()

  constructor(private connection: Connection) {}

  /** Returns the config for a document, loading it if necessary. */
  async getForDocument(documentUri: string, workspaceRoots: Array<string>): Promise<Config | null> {
    const docPath = uriToPath(documentUri)

    if (!docPath) {
      return null
    }

    // Check if any cached config covers this document.
    const cached = this.findCached(docPath)

    if (cached) {
      return cached
    }

    // Discover and load new config.
    const configPath = findNearestConfig(docPath, workspaceRoots)

    if (!configPath) {
      return null
    }

    try {
      const config = await loadConfig({ exact: configPath })

      this.cache.set(normalizeFsPath(configPath), config)
      this.connection.console.log(`Loaded Snow config: ${configPath}`)

      return config
    } catch (error) {
      this.connection.console.error(`Failed to load config: ${error}`)
      return null
    }
  }

  /** Invalidates a cached config by its path. */
  invalidate(configPath: string): void {
    const normalized = normalizeFsPath(configPath)

    if (this.cache.delete(normalized)) {
      this.connection.console.log(`Invalidated Snow config: ${configPath}`)
    }
  }

  /** Invalidates all cached configs. */
  invalidateAll(): void {
    const count = this.cache.size
    this.cache.clear()
    this.connection.console.log(`Invalidated ${count} cached config(s)`)
  }

  /** Finds a cached config that covers the given document path. */
  private findCached(docPath: string): Config | null {
    for (const [configPath, config] of this.cache) {
      const configDir = dirname(configPath)

      if (docPath.startsWith(configDir)) {
        return config
      }
    }

    return null
  }
}
