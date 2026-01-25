import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Supported config file extensions. Basically what Jiti supports. */
export const CONFIG_EXTENSIONS: Array<string> = ['.ts', '.cts', '.mts', '.js', '.cjs', '.mjs']

/** Default config files. */
export const CONFIG_FILES: Array<string> = CONFIG_EXTENSIONS.map((ext) => `snow.config${ext}`)

/** Returns the static config meta: supported extensions and default file names with extension. */
export function staticConfigMeta(): { extensions: Array<string>; files: Array<string> } {
  return {
    extensions: CONFIG_EXTENSIONS,
    files: CONFIG_FILES,
  }
}

/** Finds the nearest Snow config file by walking up from the given path. */
export function findNearestConfig(filePath: string, workspaceRoots: Array<string>): string | null {
  let current = dirname(filePath)
  let last = ''

  while (current !== last) {
    for (const name of CONFIG_FILES) {
      const configPath = join(current, name)

      if (existsSync(configPath)) {
        return configPath
      }
    }

    // Stop at workspace boundary.
    if (workspaceRoots.some((root) => current === root)) {
      break
    }

    last = current
    current = dirname(current)
  }

  return null
}
