import type { Connection } from 'vscode-languageserver'

/** LSP server settings synced from the client. */
export interface Settings {
  inlayHints: boolean
}

/** Default settings (all opt-in features disabled). */
export const defaultSettings: Settings = {
  inlayHints: false,
}

/** Pulls current settings from the client via workspace/configuration. */
export async function pullSettings(connection: Connection): Promise<Settings> {
  try {
    const raw = await connection.workspace.getConfiguration({
      section: 'snowcss',
    })

    return {
      inlayHints: raw?.inlayHints ?? defaultSettings.inlayHints,
    }
  } catch {
    return { ...defaultSettings }
  }
}
