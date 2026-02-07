import type {
  ColorPresentationParams,
  CompletionParams,
  Connection,
  DidChangeWatchedFilesParams,
  DocumentColorParams,
  HoverParams,
  InitializeParams,
  InitializeResult,
  InlayHintParams,
  ServerCapabilities,
} from 'vscode-languageserver'
import { DidChangeWatchedFilesNotification, TextDocumentSyncKind } from 'vscode-languageserver'
import type { TextDocumentChangeEvent, TextDocuments } from 'vscode-languageserver/node'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { ConfigCache } from './cache'
import {
  computeDiagnostics,
  handleCompletion,
  handleDocumentColor,
  handleHover,
  handleInlayHint,
} from './features'
import type { Settings } from './settings'
import { pullSettings, resolveDefaults } from './settings'
import { normalizeFsPath, uriToPath } from './utils'

/** Snow CSS LSP server. */
export class SnowLspServer {
  private configCache: ConfigCache
  private workspaceRoots: Array<string> = []
  private defaults: Settings = { diagnostics: true, inlayHints: false }
  private settings: Settings = { diagnostics: true, inlayHints: false }
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    private connection: Connection,
    private documents: TextDocuments<TextDocument>,
  ) {
    this.configCache = new ConfigCache(connection)
  }

  /** Starts the server and registers all handlers. */
  start(): void {
    this.registerHandlers()
    this.documents.listen(this.connection)
    this.connection.listen()
  }

  /** Registers all LSP handlers. */
  private registerHandlers(): void {
    this.connection.onInitialize(this.handleInitialize.bind(this))
    this.connection.onInitialized(this.handleInitialized.bind(this))
    this.connection.onDidChangeWatchedFiles(this.handleDidChangeWatchedFiles.bind(this))
    this.connection.onDidChangeConfiguration(this.handleDidChangeConfiguration.bind(this))
    this.connection.onCompletion(this.handleCompletion.bind(this))
    this.connection.onHover(this.handleHover.bind(this))
    this.connection.onDocumentColor(this.handleDocumentColor.bind(this))
    this.connection.onColorPresentation(this.handleColorPresentation.bind(this))
    this.connection.languages.inlayHint.on(this.handleInlayHint.bind(this))
    this.connection.onRequest('snowcss/reloadConfig', this.handleReloadConfig.bind(this))
    this.connection.onShutdown(this.handleShutdown.bind(this))

    // Document lifecycle handlers for diagnostics.
    this.documents.onDidOpen(this.handleDidOpen.bind(this))
    this.documents.onDidChangeContent(this.handleDidChangeContent.bind(this))
    this.documents.onDidClose(this.handleDidClose.bind(this))
  }

  /** Handles the initialize request. */
  private handleInitialize(params: InitializeParams): InitializeResult {
    // Store workspace folders.
    if (params.workspaceFolders) {
      this.workspaceRoots = params.workspaceFolders
        .map((folder) => uriToPath(folder.uri))
        .filter((path): path is string => path !== null)
    } else if (params.rootUri) {
      const root = uriToPath(params.rootUri)

      if (root) {
        this.workspaceRoots = [root]
      }
    }

    this.connection.console.info(
      `Workspace roots: ${this.workspaceRoots.length ? this.workspaceRoots.join(', ') : '(none)'}`,
    )

    // Resolve defaults from client capabilities.
    this.defaults = resolveDefaults(params.capabilities)
    this.settings = { ...this.defaults }

    this.connection.console.info(
      `Client capabilities — ` +
        [
          `inlayHints: ${!!params.capabilities.textDocument?.inlayHint}`,
          `workspaceFolders: ${!!params.capabilities.workspace?.workspaceFolders}`,
        ].join(', '),
    )

    const capabilities: ServerCapabilities = {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        // Trigger on quotes (start of path), dot (segment separator), slash (modifier),
        // and dashes/underscores (function name and path chars). Client re-filtering
        // handles the rest.
        triggerCharacters: [...Array.from(`"'./-_`)],
        resolveProvider: false,
      },
      hoverProvider: true,
      colorProvider: true,
    }

    // Only advertise inlay hints if the client supports them.
    if (params.capabilities.textDocument?.inlayHint) {
      capabilities.inlayHintProvider = true
    }

    // Add workspace support if client supports it.
    if (params.capabilities.workspace?.workspaceFolders) {
      capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      }
    }

    return {
      capabilities,
      serverInfo: {
        name: 'snowcss-lsp',
        version: __VERSION__,
      },
    }
  }

  /** Handles the initialized notification. */
  private async handleInitialized(): Promise<void> {
    this.settings = await pullSettings(this.connection, this.defaults)

    this.connection.console.info(
      `Settings — ` +
        [
          `diagnostics: ${this.settings.diagnostics}`,
          `inlayHints: ${this.settings.inlayHints}`,
        ].join(', '),
    )

    await this.connection.client.register(DidChangeWatchedFilesNotification.type, {
      watchers: [
        {
          globPattern: '**/snow.config.{ts,cts,mts,js,cjs,mjs}',
        },
      ],
    })

    this.connection.console.info('Snow CSS LSP server initialized.')
  }

  /** Handles watched file changes (config invalidation). */
  private handleDidChangeWatchedFiles(params: DidChangeWatchedFilesParams): void {
    this.connection.console.info(`Config file changes detected: ${params.changes.length} file(s).`)

    for (const change of params.changes) {
      const configPath = uriToPath(change.uri)

      if (configPath) {
        this.configCache.invalidate(normalizeFsPath(configPath))
      }
    }

    // Re-validate all open documents with potentially new config.
    this.revalidateAllDocuments()
  }

  /** Handles server shutdown. */
  private handleShutdown(): void {
    this.connection.console.info('Shutting down Snow CSS LSP server.')
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }

    this.debounceTimers.clear()
    this.configCache.invalidateAll()
  }

  /** Handles the reload config request. */
  private handleReloadConfig(): { success: boolean } {
    this.connection.console.info('Config reload requested by client.')
    this.configCache.invalidateAll()
    this.revalidateAllDocuments()

    return {
      success: true,
    }
  }

  /** Handles document open — run diagnostics immediately. */
  private handleDidOpen(event: TextDocumentChangeEvent<TextDocument>): void {
    this.validateDocument(event.document)
  }

  /** Handles document content change — debounced diagnostics. */
  private handleDidChangeContent(event: TextDocumentChangeEvent<TextDocument>): void {
    this.scheduleDiagnostics(event.document)
  }

  /** Handles document close — clear diagnostics and cancel pending timer. */
  private handleDidClose(event: TextDocumentChangeEvent<TextDocument>): void {
    this.clearDiagnosticsTimer(event.document.uri)
    this.connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] })
  }

  /** Handles completion requests. */
  private async handleCompletion(params: CompletionParams) {
    try {
      const document = this.documents.get(params.textDocument.uri)
      if (!document) return []

      const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
      if (!config) return []

      return handleCompletion(params, document, config)
    } catch (error) {
      this.connection.console.error(`Completion failed: ${error}`)
      return []
    }
  }

  /** Handles hover requests. */
  private async handleHover(params: HoverParams) {
    try {
      const document = this.documents.get(params.textDocument.uri)
      if (!document) return null

      const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
      if (!config) return null

      return handleHover(params, document, config)
    } catch (error) {
      this.connection.console.error(`Hover failed: ${error}`)
      return null
    }
  }

  /** Handles document color requests. */
  private async handleDocumentColor(params: DocumentColorParams) {
    try {
      const document = this.documents.get(params.textDocument.uri)
      if (!document) return []

      const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
      if (!config) return []

      return handleDocumentColor(document, config)
    } catch (error) {
      this.connection.console.error(`Document color failed: ${error}`)
      return []
    }
  }

  /** Handles inlay hint requests. */
  private async handleInlayHint(params: InlayHintParams) {
    try {
      if (!this.settings.inlayHints) return []

      const document = this.documents.get(params.textDocument.uri)
      if (!document) return []

      const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
      if (!config) return []

      return handleInlayHint(params, document, config)
    } catch (error) {
      this.connection.console.error(`Inlay hint failed: ${error}`)
      return []
    }
  }

  /** Handles color presentation requests. */
  private handleColorPresentation(_params: ColorPresentationParams) {
    // Colors are defined in the config, not editable in CSS.
    return []
  }

  /** Handles configuration changes from the client. */
  private async handleDidChangeConfiguration(): Promise<void> {
    this.settings = await pullSettings(this.connection, this.defaults)

    this.connection.console.info(
      `Settings updated — ` +
        [
          `diagnostics: ${this.settings.diagnostics}`,
          `inlayHints: ${this.settings.inlayHints}`,
        ].join(', '),
    )

    this.connection.languages.inlayHint.refresh()
    this.revalidateAllDocuments()
  }

  /** Schedules a debounced diagnostic run for a document. */
  private scheduleDiagnostics(document: TextDocument): void {
    this.clearDiagnosticsTimer(document.uri)

    const timer = setTimeout(() => {
      this.debounceTimers.delete(document.uri)
      this.validateDocument(document)
    }, 300)

    this.debounceTimers.set(document.uri, timer)
  }

  /** Clears a pending diagnostic timer for a URI. */
  private clearDiagnosticsTimer(uri: string): void {
    const timer = this.debounceTimers.get(uri)

    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(uri)
    }
  }

  /** Runs diagnostics on a document and pushes results to the client. */
  private async validateDocument(document: TextDocument): Promise<void> {
    if (!this.settings.diagnostics) {
      this.connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
      return
    }

    const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)

    if (!config) {
      this.connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
      return
    }

    try {
      const diagnostics = computeDiagnostics(document, config)
      this.connection.sendDiagnostics({ uri: document.uri, diagnostics })
    } catch (error) {
      this.connection.console.error(`Diagnostics failed for ${document.uri}: ${error}`)
      this.connection.sendDiagnostics({ uri: document.uri, diagnostics: [] })
    }
  }

  /** Re-validates all currently open documents. */
  private revalidateAllDocuments(): void {
    for (const document of this.documents.all()) {
      this.validateDocument(document)
    }
  }
}
