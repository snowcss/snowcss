#!/usr/bin/env node

import { ProposedFeatures, TextDocuments, createConnection } from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'

import { SnowLspServer } from './server'

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)
const server = new SnowLspServer(connection, documents)

server.start()
