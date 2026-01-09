import type { DeepMergeAllFn } from '@fastify/deepmerge'
import { deepmerge } from '@fastify/deepmerge'

/** Deeply merges arbitrary number of objects into a single object. The last object wins. */
export const merge: DeepMergeAllFn = deepmerge({
  all: true,
})
