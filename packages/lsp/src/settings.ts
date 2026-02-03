import type { Connection } from 'vscode-languageserver'

/** LSP server settings synced from the client. */
export interface Settings {
  diagnostics: boolean
  inlayHints: boolean
}

/** Default settings. Diagnostics are opt-out, inlay hints are opt-in. */
export const defaultSettings: Settings = {
  diagnostics: true,
  inlayHints: false,
}

/** Pulls current settings from the client via workspace/configuration. */
export async function pullSettings(connection: Connection): Promise<Settings> {
  try {
    const raw = await connection.workspace.getConfiguration({
      section: 'snowcss',
    })

    return {
      diagnostics: raw?.diagnostics ?? defaultSettings.diagnostics,
      inlayHints: raw?.inlayHints ?? defaultSettings.inlayHints,
    }
  } catch {
    return { ...defaultSettings }
  }
}
