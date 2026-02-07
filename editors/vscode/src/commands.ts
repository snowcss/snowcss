import { findNearestConfig } from '@snowcss/internal/shared'
import type { ExtensionContext } from 'vscode'
import { commands, window, workspace } from 'vscode'

import { STATE_DISMISS_LSP_PROMPT } from './constants'
import { getOutputChannel, logInfo } from './logger'
import { getClient } from './lsp'

/** Registers all extension commands. */
export function registerCommands(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand('snowcss.restartServer', async () => {
      logInfo('Command: restartServer')

      const client = getClient()

      if (!client) {
        window.showWarningMessage('Snow CSS language server is not running.')
        return
      }

      await client.restart()
      logInfo('Server restarted.')
    }),

    commands.registerCommand('snowcss.showOutput', () => {
      const client = getClient()

      if (client) {
        client.outputChannel.show()
      } else {
        getOutputChannel()?.show()
      }
    }),

    commands.registerCommand('snowcss.openConfig', async () => {
      logInfo('Command: openConfig')

      const activeFile = window.activeTextEditor?.document.uri.fsPath

      if (!activeFile) {
        return
      }

      const workspaceRoots = workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? []
      const configPath = findNearestConfig(activeFile, workspaceRoots)

      if (configPath) {
        logInfo(`Opening config: ${configPath}`)
        const doc = await workspace.openTextDocument(configPath)
        await window.showTextDocument(doc)
      } else {
        window.showWarningMessage('No snow.config.* file found.')
      }
    }),

    commands.registerCommand('snowcss.reloadConfig', async () => {
      logInfo('Command: reloadConfig')

      const client = getClient()

      if (!client) {
        window.showWarningMessage('Snow CSS language server is not running.')
        return
      }

      await client.sendRequest('snowcss/reloadConfig')
    }),

    commands.registerCommand('snowcss.resetLspPrompt', async () => {
      logInfo('Command: resetLspPrompt')
      await context.globalState.update(STATE_DISMISS_LSP_PROMPT, undefined)
      window.showInformationMessage('Snow CSS LSP install prompt has been re-enabled.')
    }),
  )
}
