import type { ExtensionContext } from 'vscode'
import type { LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node'
import { LanguageClient, TransportKind } from 'vscode-languageclient/node'

const LANGUAGES = [
  'astro',
  'css',
  'html',
  'less',
  'postcss',
  'scss',
  'svelte',
  'vue-html',
  'vue-postcss',
  'vue',
]

let client: LanguageClient | null = null

/** Returns the current language client instance. */
export function getClient(): LanguageClient | null {
  return client
}

/** Starts the language client with the given server path. */
export async function startClient(context: ExtensionContext, serverPath: string): Promise<void> {
  const serverOptions: ServerOptions = {
    run: {
      command: serverPath,
      transport: TransportKind.stdio,
    },
    debug: {
      command: serverPath,
      transport: TransportKind.stdio,
    },
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: LANGUAGES.map((language) => ({
      scheme: 'file',
      language,
    })),
  }

  client = new LanguageClient('snowcss', 'Snow CSS', serverOptions, clientOptions)
  context.subscriptions.push(client)

  await client.start()
}

/** Stops the language client. */
export async function stopClient(): Promise<void> {
  if (client) {
    await client.stop()
    client = null
  }
}
