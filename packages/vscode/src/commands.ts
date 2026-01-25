import { findNearestConfig } from '@snowcss/internal/shared'
import type { ExtensionContext } from 'vscode'
import { commands, window, workspace } from 'vscode'

import { getClient } from './lsp'

/** Registers all extension commands. */
export function registerCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand('snowcss.restartServer', async () => {
      const client = getClient()

      if (!client) {
        window.showWarningMessage('Snow CSS language server is not running.')
        return
      }

      await client.restart()
    }),

    commands.registerCommand('snowcss.showOutput', () => {
      getClient()?.outputChannel.show()
    }),

    commands.registerCommand('snowcss.openConfig', async () => {
      const activeFile = window.activeTextEditor?.document.uri.fsPath

      if (!activeFile) {
        return
      }

      const workspaceRoots = workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? []
      const configPath = findNearestConfig(activeFile, workspaceRoots)

      if (configPath) {
        const doc = await workspace.openTextDocument(configPath)
        await window.showTextDocument(doc)
      } else {
        window.showWarningMessage('No snow.config.* file found.')
      }
    }),

    commands.registerCommand('snowcss.reloadConfig', async () => {
      const client = getClient()

      if (!client) {
        window.showWarningMessage('Snow CSS language server is not running.')
        return
      }

      await client.sendRequest('snowcss/reloadConfig')
    }),
  )
}
