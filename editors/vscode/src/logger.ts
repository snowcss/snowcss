import type { LogOutputChannel } from 'vscode'
import { window } from 'vscode'

let channel: LogOutputChannel | null = null

/** Creates the shared output channel. Must be called once during activation. */
export function createOutputChannel(): LogOutputChannel {
  channel = window.createOutputChannel('Snow CSS', {
    log: true,
  })

  return channel
}

/** Returns the shared output channel. */
export function getOutputChannel(): LogOutputChannel | null {
  return channel
}

/** Logs an info-level message. */
export function logInfo(message: string): void {
  channel?.appendLine(`[info] ${message}`)
}

/** Logs a warning-level message. */
export function logWarn(message: string): void {
  channel?.appendLine(`[warn] ${message}`)
}

/** Logs an error-level message. */
export function logError(message: string): void {
  channel?.appendLine(`[error] ${message}`)
}
