// Prevent exploiting prototype chain.
const CACHE = Object.create(null)
// Prevent mutating conceptually immutable registry of tokens.
const REGISTRY = Object.freeze(/* REGISTRY */)

const toCssVarRef = (segments) =>
  `var(--${segments.map((it) => it.replaceAll('.', '\\.')).join('-')})`

function resolve(path) {
  if (CACHE[path]) return CACHE[path]

  let parts = path.split('.')
  let segments = []
  let node = REGISTRY

  for (let index = 0, size = parts.length; index < size; index++) {
    let segment = parts[index]

    // Merge consecutive numeric parts into decimal numbers.
    while (index + 1 < size && !isNaN(segment) && !isNaN(parts[index + 1])) {
      segment += '.' + parts[++index]
    }

    // Push the current segment to the segments to be used for the CSS variable name.
    segments.push(segment)

    // If next node is defined, continue to the next segment, otherwise short-circuit.
    if ((node = node?.[segment])) continue
    return
  }

  const isPartial = typeof node === 'object'

  CACHE[path] = node = {
    ref: isPartial ? null : toCssVarRef(segments),
    value: node,
  }

  return node
}

// Warms up the cache by resolving all tokens.
export function warmupCache() {
  function traverse(node, segments = []) {
    for (const [segment, child] of Object.entries(node)) {
      const path = [...segments, segment]

      if (typeof child === 'object' && child !== null) {
        traverse(child, path)
      } else {
        resolve(path.join('.'))
      }
    }
  }

  traverse(REGISTRY)
}

// Returns a CSS variable reference, e.g. 'var(--color-amber-500)'.
export function token(path) {
  return resolve(path).ref
}

// Returns the resolved value of a token, e.g. '#f59e0b' or a partial object.
export function value(path) {
  const resolved = resolve(path)
  return resolved?.value ?? resolved ?? null
}

// Returns all available tokens.
export function tokens() {
  return REGISTRY
}
