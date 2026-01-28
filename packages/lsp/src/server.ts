import type {
  ColorPresentationParams,
  CompletionParams,
  Connection,
  DidChangeWatchedFilesParams,
  DocumentColorParams,
  HoverParams,
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
} from 'vscode-languageserver'
import { DidChangeWatchedFilesNotification, TextDocumentSyncKind } from 'vscode-languageserver'
import type { TextDocuments } from 'vscode-languageserver/node'
import type { TextDocument } from 'vscode-languageserver-textdocument'

import { ConfigCache } from './cache'
import { handleCompletion, handleDocumentColor, handleHover } from './features'
import { normalizeFsPath, uriToPath } from './utils'

/** Snow CSS LSP server. */
export class SnowLspServer {
  private configCache: ConfigCache
  private workspaceRoots: Array<string> = []

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
    this.connection.onCompletion(this.handleCompletion.bind(this))
    this.connection.onHover(this.handleHover.bind(this))
    this.connection.onDocumentColor(this.handleDocumentColor.bind(this))
    this.connection.onColorPresentation(this.handleColorPresentation.bind(this))
    this.connection.onRequest('snowcss/reloadConfig', this.handleReloadConfig.bind(this))
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

    const capabilities: ServerCapabilities = {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        // Trigger on quotes (start of path), dot (segment separator), slash (modifier),
        // and all alphanumeric chars for smooth editing.
        //
        // TODO: Maybe make this configurable?
        triggerCharacters: [
          ...Array.from(`"'./-_`),
          ...Array.from('abcdefghijklmnopqrstuvwxyz'),
          ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
          ...Array.from('0123456789'),
        ],
        resolveProvider: false,
      },
      hoverProvider: true,
      colorProvider: true,
    }

    // Add workspace support if client supports it.
    if (params.capabilities.workspace?.workspaceFolders) {
      capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      }
    }

    return { capabilities }
  }

  /** Handles the initialized notification. */
  private async handleInitialized(): Promise<void> {
    // Register file watchers for Snow config files.
    await this.connection.client.register(DidChangeWatchedFilesNotification.type, {
      watchers: [
        {
          globPattern: '**/snow.config.{ts,cts,mts,js,cjs,mjs}',
        },
      ],
    })

    this.connection.console.log('Snow CSS LSP server initialized')
  }

  /** Handles watched file changes (config invalidation). */
  private handleDidChangeWatchedFiles(params: DidChangeWatchedFilesParams): void {
    for (const change of params.changes) {
      const configPath = uriToPath(change.uri)

      if (configPath) {
        this.configCache.invalidate(normalizeFsPath(configPath))
      }
    }
  }

  /** Handles the reload config request. */
  private handleReloadConfig(): { success: boolean } {
    this.configCache.invalidateAll()

    return {
      success: true,
    }
  }

  /** Handles completion requests. */
  private async handleCompletion(params: CompletionParams) {
    const document = this.documents.get(params.textDocument.uri)
    if (!document) return []

    const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
    if (!config) return []

    return handleCompletion(params, document, config)
  }

  /** Handles hover requests. */
  private async handleHover(params: HoverParams) {
    const document = this.documents.get(params.textDocument.uri)
    if (!document) return null

    const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
    if (!config) return null

    return handleHover(params, document, config)
  }

  /** Handles document color requests. */
  private async handleDocumentColor(params: DocumentColorParams) {
    const document = this.documents.get(params.textDocument.uri)
    if (!document) return []

    const config = await this.configCache.getForDocument(document.uri, this.workspaceRoots)
    if (!config) return []

    return handleDocumentColor(document, config)
  }

  /** Handles color presentation requests. */
  private handleColorPresentation(_params: ColorPresentationParams) {
    // Colors are defined in the config, not editable in CSS.
    return []
  }
}
