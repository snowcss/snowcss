import { URI } from 'vscode-uri'

const WINDOWS_PATH_SEP_RE = /\\/g

/** Converts a `file://` URI to a file system path. */
export function uriToPath(uri: string): string | null {
  const parsed = URI.parse(uri)
  return parsed.scheme === 'file' ? normalizeFsPath(parsed.fsPath) : null
}

/** Normalizes a file system path by replacing backslashes with forward slashes. */
export function normalizeFsPath(path: string): string {
  return path.replace(WINDOWS_PATH_SEP_RE, '/')
}
