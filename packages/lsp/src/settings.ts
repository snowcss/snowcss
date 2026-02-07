import type { ClientCapabilities, Connection } from 'vscode-languageserver'

/** LSP server settings synced from the client. */
export interface Settings {
  diagnostics: boolean
  inlayHints: boolean
}

/** Resolves default settings from client capabilities. */
export function resolveDefaults(capabilities: ClientCapabilities): Settings {
  return {
    diagnostics: !!capabilities.textDocument?.publishDiagnostics,
    inlayHints: !!capabilities.textDocument?.inlayHint,
  }
}

/** Pulls current settings from the client via workspace/configuration. */
export async function pullSettings(connection: Connection, defaults: Settings): Promise<Settings> {
  try {
    const raw = await connection.workspace.getConfiguration({
      section: 'snowcss',
    })

    return {
      diagnostics: raw?.diagnostics ?? defaults.diagnostics,
      inlayHints: raw?.inlayHints ?? defaults.inlayHints,
    }
  } catch {
    connection.console.warn('Failed to pull settings, using defaults.')
    return { ...defaults }
  }
}
