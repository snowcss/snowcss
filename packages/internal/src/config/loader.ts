import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { createJiti } from 'jiti'

import { Config } from './config'
import { CONFIG_FILES } from './discovery'
import type { UserConfig } from './user'

export interface LoadConfigOptions {
  /** The root directory. */
  root?: string
  /** The relative (to `root`) path to the Snow config file. */
  path?: string
  /** The absolute path to the Snow config file. `root` and `path` are ignored if this is set. */
  exact?: string
}

/** Jiti instance. */
const jiti = createJiti(import.meta.url, {
  moduleCache: false,
})

/**
 * Loads the Snow config, either from a specified file or from the default locations at
 * `process.cwd()`.
 */
export async function loadConfig(options: LoadConfigOptions): Promise<Config> {
  let configPath: string | null = null

  if (options.exact) {
    configPath = options.exact
  } else {
    const paths = options.path ? [options.path] : CONFIG_FILES

    const root = options.root ?? process.cwd()
    const resolved = paths.map((it) => resolve(root, it))
    const found = resolved.find((it) => existsSync(it))

    if (found) {
      configPath = found
    }
  }

  if (!configPath) {
    throw new Error('Could not find Snow config file')
  }

  try {
    const config = await jiti.import<UserConfig>(configPath, {
      default: true,
    })

    return Config.create(config, configPath)
  } catch (error) {
    throw new Error(`Failed to load Snow config: ${error}`)
  }
}
