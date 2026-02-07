import { isInsidePath, isQuote } from '@snowcss/internal/shared'
import type { ExtensionContext, TextDocumentChangeEvent } from 'vscode'
import { ConfigurationTarget, commands, window, workspace } from 'vscode'

import { registerCommands } from './commands'
import { STATE_DISMISS_LSP_PROMPT, STATE_LSP_FOUND_NOTIFIED } from './constants'
import type { LspSource } from './discovery'
import { findLspExecutable, promptInstallLsp } from './discovery'
import { createOutputChannel, logInfo, logWarn } from './logger'
import { startClient, stopClient } from './lsp'

const LSP_SOURCE_LABELS: Record<LspSource, string> = {
  path: 'via configured path',
  local: 'locally in node_modules',
  global: 'via global installation',
}

/** Applies the CSS hover setting based on Snow CSS configuration. */
async function applyCssHoverSetting(): Promise<void> {
  const snowConfig = workspace.getConfiguration('snowcss')
  const inspection = snowConfig.inspect<boolean>('hover.disableBuiltinCss')

  // Only act if the user has explicitly configured the setting.
  const explicit =
    inspection?.globalValue ?? inspection?.workspaceValue ?? inspection?.workspaceFolderValue

  if (explicit === undefined) return

  // Toggle VS Code CSS hover settings. This is the best we can do to avoid CSS docs and references
  // cluttering the hover contents.
  const cssConfig = workspace.getConfiguration('css')

  await cssConfig.update('hover.documentation', !explicit, ConfigurationTarget.Workspace)
  await cssConfig.update('hover.references', !explicit, ConfigurationTarget.Workspace)
}

/** Handles document changes to trigger completions inside Snow CSS paths. */
function handleDocumentChange(event: TextDocumentChangeEvent): void {
  if (event.contentChanges.length === 0) {
    return
  }

  const change = event.contentChanges[0]
  const startOffset = event.document.offsetAt(change.range.start)

  // Calculate cursor position after the change.
  //
  // - For deletion: cursor at start of deleted range.
  // - For insertion/replacement: cursor at end of inserted text.
  const cursorOffset = startOffset + change.text.length

  // Detect completion selection, a replacement that ends right before a quote.
  if (change.rangeLength > 0 && change.text.length > 0) {
    const [afterChange] = event.document.getText().slice(cursorOffset)

    if (isQuote(afterChange)) {
      return
    }
  }

  if (isInsidePath(event.document.getText(), cursorOffset)) {
    commands.executeCommand('editor.action.triggerSuggest')
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  const outputChannel = createOutputChannel()

  logInfo('Activating Snow CSS extension.')

  registerCommands(context)

  await applyCssHoverSetting()

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('snowcss.hover.disableBuiltinCss')) {
        applyCssHoverSetting()
      }
    }),
  )

  context.subscriptions.push(workspace.onDidChangeTextDocument(handleDocumentChange))

  logInfo('Discovering LSP server executable.')

  let discovery = await findLspExecutable()

  if (!discovery) {
    const dismissed = context.globalState.get<boolean>(STATE_DISMISS_LSP_PROMPT)

    if (!dismissed) {
      const installed = await promptInstallLsp(context)

      if (installed) {
        logInfo('Retrying LSP discovery after install.')
        discovery = await findLspExecutable()
      }
    }
  }

  if (!discovery) {
    logWarn('LSP server not available. LSP features disabled.')
    window.showWarningMessage('Snow CSS language server not available. LSP features are disabled.')
    return
  }

  logInfo(`LSP server found: ${discovery.path} (${discovery.source}).`)

  // Show a one-time notification about the discovered LSP.
  if (!context.globalState.get<boolean>(STATE_LSP_FOUND_NOTIFIED)) {
    const label = LSP_SOURCE_LABELS[discovery.source]
    window.showInformationMessage(`Snow CSS language server found (${label}).`)
    await context.globalState.update(STATE_LSP_FOUND_NOTIFIED, true)
  }

  await startClient(context, discovery.path, outputChannel)
  logInfo('Language client started.')
}

export async function deactivate(): Promise<void> {
  logInfo('Deactivating Snow CSS extension.')
  await stopClient()
}
