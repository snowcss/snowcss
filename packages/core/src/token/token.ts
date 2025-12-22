import { parse, walk } from 'css-tree'

import { Path } from '@/path'

import {
  AbsoluteParser,
  ColorParser,
  RawParser,
  RelativeParser,
  type TokenValue,
  ValueParserChain,
} from './values'

const valueParserChain = new ValueParserChain([
  new ColorParser(),
  new AbsoluteParser(),
  new RelativeParser(),
  new RawParser(),
])

/** Represents a parsed design token with its value(s). */
export class Token {
  constructor(
    /** Token path in the tokens object. */
    public readonly path: Path,
    /** Unparsed value of the token. */
    public readonly raw: string,
    /** Token value(s). */
    public readonly values: Array<TokenValue>,
  ) {}

  /** Creates a token from a path and raw value. */
  public static from(rawPath: Array<string> | Path, raw: string): Token {
    const path = Array.isArray(rawPath) ? new Path(rawPath) : rawPath
    const values = parseValues(raw)

    return new Token(path, raw, values)
  }
}

function parseValues(raw: string): Array<TokenValue> {
  const values: Array<TokenValue> = []

  const ast = parse(raw, {
    context: 'value',
    positions: true,
  })

  walk(ast, (root) => {
    if (root.type === 'Value') {
      for (const node of root.children) {
        // Get the node value from the input string using the node location.
        const start = node.loc?.start.offset ?? 0
        const end = node.loc?.end.offset ?? raw.length
        const input = raw.substring(start, end)

        // Actually parse the value.
        const value = valueParserChain.parse({ input, node })

        if (value) {
          values.push(value)
        }
      }
    }
  })

  return values
}
