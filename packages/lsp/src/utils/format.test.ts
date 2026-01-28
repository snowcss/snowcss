import { AlphaModifier, Config, NegateModifier, Token, UnitModifier } from '@snowcss/internal'
import { describe, expect, it } from 'vitest'

import { formatTokenDocumentation } from './format'

function createMockConfig(): Config {
  const userConfig = {
    inject: 'asset' as const,
    rootFontSize: 16,
    tokens: {},
  }

  return Config.create(userConfig, '/mock/path')
}

describe('formatTokenDocumentation', () => {
  it('formats rem with px modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '1rem')
    const modifier = new UnitModifier('px')

    const result = formatTokenDocumentation(token, config, modifier)

    expect(result.value).toContain('--token: 16px /* 1rem */;')
  })

  it('formats px with rem modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '16px')
    const modifier = new UnitModifier('rem')

    const result = formatTokenDocumentation(token, config, modifier)

    expect(result.value).toContain('--token: 1rem /* 16px */;')
  })

  it('formats color with alpha modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '#afafaf')
    // 0xAA / 0xFF ≈ 0.667.
    const modifier = new AlphaModifier(0.667)

    const result = formatTokenDocumentation(token, config, modifier)

    expect(result.value).toContain('/* #afafaf */')
    expect(result.value).toMatch(/#afafaf[a-f0-9]{2}/)
  })

  it('formats rem without modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '1rem')

    const result = formatTokenDocumentation(token, config)

    expect(result.value).toContain('--token: 1rem /* 16px */;')
  })

  it('formats rem with negate modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '1rem')
    const modifier = new NegateModifier()

    const result = formatTokenDocumentation(token, config, modifier)

    expect(result.value).toContain('--token: -1rem /* -16px */;')
  })

  it('formats px with negate modifier', () => {
    const config = createMockConfig()
    const token = Token.from(['token'], '16px')
    const modifier = new NegateModifier()

    const result = formatTokenDocumentation(token, config, modifier)

    expect(result.value).toContain('--token: -16px;')
    expect(result.value).not.toContain('/*')
  })
})
