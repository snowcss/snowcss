import type { CssNode } from 'css-tree'
import type { Color } from 'culori'
import { clampRgb, formatCss, formatHex, formatHex8, formatRgb, parse, rgb } from 'culori'

import type { TokenValue, TokenValueInput, TokenValueParser } from './index'
import type { Modifiable, ModifyContext, ValueModifier } from './modifier'
import { AlphaModifier } from './modifier'

/** RGBA color with values in the [0, 1] range. */
export interface RgbaColor {
  r: number
  g: number
  b: number
  alpha: number
}

/** Represents a color value. */
export class ColorValue implements Modifiable {
  constructor(
    /** Raw value as a string. */
    readonly raw: string,
    /** Whether the value is a hex color. */
    readonly hex: boolean,
    /** Color object. */
    readonly color: Color,
  ) {}

  /** Applies a modifier to this color value. */
  apply(modifier: ValueModifier, _ctx: ModifyContext): string | null {
    if (modifier instanceof AlphaModifier) {
      const value = new ColorValue(this.raw, this.hex, {
        ...this.color,
        alpha: modifier.value,
      })

      return value.toCss()
    }

    return null
  }

  /** Returns the color formatted as a hex string. */
  toHex(): string {
    return this.color.alpha === 1 ? formatHex(this.color) : formatHex8(this.color)
  }

  /** Returns the color formatted as a CSS color according to the source format. */
  toCss(): string {
    if (this.hex) return this.toHex()
    if (this.color.mode === 'rgb') return formatRgb(this.color)

    return formatCss(this.color)
  }

  /** Returns the color as an RGBA object with values in the [0, 1] range. */
  toRgba(): RgbaColor {
    const converted = rgb(this.color, 'rgb')
    const clamped = clampRgb(converted)

    return {
      ...clamped,
      alpha: clamped.alpha ?? 1,
    }
  }
}

export class ColorParser implements TokenValueParser {
  tryParse({ input, node }: TokenValueInput): TokenValue | null {
    const rawColorValue = this.tryGetColorFromNode(input, node)

    if (rawColorValue) {
      const [value, isHex] = rawColorValue
      const color = parse(value)

      if (color) {
        return new ColorValue(value, isHex, color)
      }
    }

    return null
  }

  private tryGetColorFromNode(
    input: string,
    node: CssNode,
  ): [value: string, isHex: boolean] | null {
    switch (node.type) {
      // HEX colors.
      case 'Hash':
        return [`#${node.value}`, true]

      // Function colors, e.g. rgb(), hsl(), etc.
      case 'Function':
        return [input, false]

      // Identifiers, e.g. red, paleblue, etc.
      case 'Identifier':
        return [node.name, false]

      default:
        return null
    }
  }
}
