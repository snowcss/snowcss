/** Fast djb2 hash function. */
export function hash(input: string, radix = 36): string {
  let hash = 5381

  for (let idx = 0, len = input.length; idx < len; idx++) {
    hash = (hash * 33) ^ input.charCodeAt(idx)
  }

  return (hash >>> 0).toString(radix)
}
