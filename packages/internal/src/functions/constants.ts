export const SnowFunctionName = {
  Token: '--token',
  Value: '--value',
} as const

export type SnowFunctionName = (typeof SnowFunctionName)[keyof typeof SnowFunctionName]
