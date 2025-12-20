/** Converts a number to a 2-digit hex string. */
export function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0')
}

/** Clamps a number between a minimum and maximum value. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Scales down a color value (or array of values) from 0-255 range to 0-1 range. */
export function scaleDown<N extends number | Array<number>>(ns: N): N {
  if (typeof ns === 'number') {
    return clamp(ns / 255, 0, 1) as N
  } else {
    return ns.map((it) => clamp(it / 255, 0, 1)) as N
  }
}

/** Scales up a color value (or array of values) from 0-1 range to 0-255 range. */
export function scaleUp<N extends number | Array<number>>(ns: N): N {
  if (typeof ns === 'number') {
    return clamp(ns * 255, 0, 255) as N
  } else {
    return ns.map((it) => clamp(it * 255, 0, 255)) as N
  }
}
