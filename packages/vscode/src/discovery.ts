import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { window, workspace } from 'vscode'

type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  pnpm: 'pnpm add -g @snowcss/lsp',
  yarn: 'yarn global add @snowcss/lsp',
  bun: 'bun add -g @snowcss/lsp',
  npm: 'npm install -g @snowcss/lsp',
}

const execAsync = promisify(exec)

/** Finds the snowcss-lsp executable using the discovery strategy. */
export async function findLspExecutable(): Promise<string | null> {
  // 1. Check user-configured path.
  const configuredPath = workspace.getConfiguration('snowcss').get<string>('lsp.path')

  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath
  }

  // 2. Check workspace-local node_modules.
  const workspaceFolders = workspace.workspaceFolders

  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      const localBin = join(folder.uri.fsPath, 'node_modules', '.bin', 'snowcss-lsp')

      if (existsSync(localBin)) {
        return localBin
      }
    }
  }

  // 3. Check global installation via which/where.
  try {
    const command = process.platform === 'win32' ? 'where snowcss-lsp' : 'which snowcss-lsp'
    const { stdout } = await execAsync(command)
    const globalPath = stdout.trim().split('\n').at(0)

    if (globalPath && existsSync(globalPath)) {
      return globalPath
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
export async function promptInstallLsp(): Promise<boolean> {
  const action = await window.showInformationMessage(
    'Snow CSS language server not found. Install it globally?',
    'Install',
    'Dismiss',
  )

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
