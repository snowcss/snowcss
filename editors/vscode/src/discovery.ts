import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'

import type { ExtensionContext } from 'vscode'
import { window, workspace } from 'vscode'

import { STATE_DISMISS_LSP_PROMPT } from './constants'

export type LspSource = 'path' | 'local' | 'global'

export interface LspDiscovery {
  path: string
  source: LspSource
}

type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  pnpm: 'pnpm add -g @snowcss/lsp',
  yarn: 'yarn global add @snowcss/lsp',
  bun: 'bun add -g @snowcss/lsp',
  npm: 'npm install -g @snowcss/lsp',
}

const execAsync = promisify(exec)

/**
 * Resolves a user-configured LSP path, expanding tilde and resolving relative paths against the
 * workspace root.
 */
function resolveLspPath(configuredPath: string): string {
  let resolved = configuredPath

  // Expand tilde to home directory.
  if (resolved.startsWith('~')) {
    resolved = join(homedir(), resolved.slice(1))
  }

  // Resolve relative paths against the first workspace folder.
  if (!isAbsolute(resolved)) {
    const root = workspace.workspaceFolders?.at(0)?.uri.fsPath

    if (root) {
      resolved = resolve(root, resolved)
    }
  }

  return resolved
}

/** Finds the snowcss-lsp executable using the discovery strategy. */
export async function findLspExecutable(): Promise<LspDiscovery | null> {
  // Check user-configured path.
  const configuredPath = workspace.getConfiguration('snowcss').get<string>('lsp.path')

  if (configuredPath) {
    const resolvedPath = resolveLspPath(configuredPath)

    if (existsSync(resolvedPath)) {
      return {
        path: resolvedPath,
        source: 'path',
      }
    }

    window.showWarningMessage(`Configured snowcss.lsp.path does not exist: ${resolvedPath}`)
  }

  // Check workspace-local node_modules.
  const workspaceFolders = workspace.workspaceFolders

  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const localBin = join(folder.uri.fsPath, 'node_modules', '.bin', 'snowcss-lsp')

      if (existsSync(localBin)) {
        return {
          path: localBin,
          source: 'local',
        }
      }
    }
  }

  // Check global installation via which/where.
  try {
    const command = process.platform === 'win32' ? 'where snowcss-lsp' : 'which snowcss-lsp'
    const { stdout } = await execAsync(command)
    const globalPath = stdout.trim().split('\n').at(0)

    if (globalPath && existsSync(globalPath)) {
      return {
        path: globalPath,
        source: 'global',
      }
    }
  } catch {
    // Command failed, executable not found globally.
  }

  return null
}

/** Detects the user's package manager. */
async function detectPackageManager(): Promise<PackageManager> {
  const workspaceFolders = workspace.workspaceFolders

  if (workspaceFolders) {
    const root = workspaceFolders.at(0)?.uri.fsPath

    if (root) {
      if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm'
      if (existsSync(join(root, 'yarn.lock'))) return 'yarn'
      if (existsSync(join(root, 'bun.lock'))) return 'bun'
    }
  }

  return 'npm'
}

/** Prompts user to install the LSP server globally. */
export async function promptInstallLsp(context: ExtensionContext): Promise<boolean> {
  const action = await window.showInformationMessage(
    'Snow CSS language server not found. Install it globally?',
    'Install',
    "Don't ask again",
    'Dismiss',
  )

  if (action === "Don't ask again") {
    await context.globalState.update(STATE_DISMISS_LSP_PROMPT, true)
    return false
  }

  if (action !== 'Install') {
    return false
  }

  const pm = await detectPackageManager()
  const installCommand = INSTALL_COMMANDS[pm]

  try {
    await window.withProgress(
      {
        location: { viewId: 'workbench.view.extensions' },
        title: 'Installing @snowcss/lsp...',
      },
      async () => {
        await execAsync(installCommand)
      },
    )

    window.showInformationMessage('Snow CSS language server installed successfully.')
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    window.showErrorMessage(`Failed to install @snowcss/lsp: ${message}`)
    return false
  }
}
