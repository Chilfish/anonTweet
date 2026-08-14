import type { ModelConfig } from '~/lib/constants'
import { describe, expect, it } from 'vitest'
import { deepseekStrategy, getProviderStrategy, getThinkingConfig, googleStrategy, openrouterStrategy } from '~/lib/providers'

function makeModelConfig(overrides: Partial<ModelConfig> = {}): ModelConfig {
  return {
    name: 'test-model',
    text: 'Test Model',
    provider: 'google',
    thinkingType: 'level',
    ...overrides,
  }
}

describe('googleStrategy', () => {
  describe('getThinkingConfig', () => {
    it('returns thinkingLevel for "level" type', () => {
      const config = makeModelConfig({ thinkingType: 'level' })
      expect(googleStrategy.getThinkingConfig(config, 'high')).toEqual({
        includeThoughts: false,
        thinkingLevel: 'high',
      })
    })

    it('returns thinkingBudget for "budget" type', () => {
      const config = makeModelConfig({ thinkingType: 'budget' })
      expect(googleStrategy.getThinkingConfig(config, 'minimal')).toEqual({
        includeThoughts: false,
        thinkingBudget: 0,
      })
      expect(googleStrategy.getThinkingConfig(config, 'low')).toEqual({
        includeThoughts: false,
        thinkingBudget: 1024,
      })
      expect(googleStrategy.getThinkingConfig(config, 'medium')).toEqual({
        includeThoughts: false,
        thinkingBudget: 4096,
      })
      expect(googleStrategy.getThinkingConfig(config, 'high')).toEqual({
        includeThoughts: false,
        thinkingBudget: 16384,
      })
      expect(googleStrategy.getThinkingConfig(config, 'max')).toEqual({
        includeThoughts: false,
        thinkingBudget: 32768,
      })
    })

    it('handles unknown thinkingType gracefully', () => {
      const config = makeModelConfig({ thinkingType: 'none' })
      expect(googleStrategy.getThinkingConfig(config, 'high')).toEqual({
        includeThoughts: false,
      })
    })
  })

  describe('buildProviderOptions', () => {
    it('wraps thinkingConfig under google key', () => {
      const config = makeModelConfig()
      const thinkingConfig = { includeThoughts: false, thinkingLevel: 'high' }
      expect(googleStrategy.buildProviderOptions(thinkingConfig, config)).toEqual({
        google: { thinkingConfig },
      })
    })
  })

  describe('createSDKProvider', () => {
    it('creates a callable provider from an API key', () => {
      const sdk = googleStrategy.createSDKProvider('test-key')
      expect(typeof sdk).toBe('function')
    })
  })

  describe('name', () => {
    it('is google', () => {
      expect(googleStrategy.name).toBe('google')
    })
  })
})

describe('deepseekStrategy', () => {
  describe('getThinkingConfig', () => {
    it('maps minimal → disabled', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.getThinkingConfig(config, 'minimal')).toBe('disabled')
    })

    it('maps low/medium/high → high', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.getThinkingConfig(config, 'low')).toBe('high')
      expect(deepseekStrategy.getThinkingConfig(config, 'medium')).toBe('high')
      expect(deepseekStrategy.getThinkingConfig(config, 'high')).toBe('high')
    })

    it('maps max → max', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.getThinkingConfig(config, 'max')).toBe('max')
    })

    it('ignores modelConfig.thinkingType', () => {
      const config = makeModelConfig({ provider: 'deepseek', thinkingType: 'budget' })
      expect(deepseekStrategy.getThinkingConfig(config, 'high')).toBe('high')
    })
  })

  describe('buildProviderOptions', () => {
    it('returns empty options for disabled thinking', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.buildProviderOptions('disabled', config)).toEqual({})
    })

    it('returns deepseek options with reasoningEffort high', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.buildProviderOptions('high', config)).toEqual({
        deepseek: { reasoningEffort: 'high' },
      })
    })

    it('returns deepseek options with max reasoningEffort', () => {
      const config = makeModelConfig({ provider: 'deepseek' })
      expect(deepseekStrategy.buildProviderOptions('max', config)).toEqual({
        deepseek: { reasoningEffort: 'max' },
      })
    })

    it('returns empty object for non-level thinkingType', () => {
      const config = makeModelConfig({ provider: 'deepseek', thinkingType: 'none' })
      expect(deepseekStrategy.buildProviderOptions('high', config)).toEqual({})
    })
  })

  describe('createSDKProvider', () => {
    it('creates a callable provider from an API key', () => {
      const sdk = deepseekStrategy.createSDKProvider('test-key')
      expect(typeof sdk).toBe('function')
    })
  })

  describe('name', () => {
    it('is deepseek', () => {
      expect(deepseekStrategy.name).toBe('deepseek')
    })
  })
})

describe('openrouterStrategy', () => {
  describe('getThinkingConfig', () => {
    it('disables reasoning at minimal level', () => {
      const config = makeModelConfig({ provider: 'openrouter' })
      expect(openrouterStrategy.getThinkingConfig(config, 'minimal')).toEqual({ enabled: false })
    })

    it('maps low/medium/high to matching effort', () => {
      const config = makeModelConfig({ provider: 'openrouter' })
      expect(openrouterStrategy.getThinkingConfig(config, 'low')).toEqual({ enabled: true, effort: 'low' })
      expect(openrouterStrategy.getThinkingConfig(config, 'medium')).toEqual({ enabled: true, effort: 'medium' })
      expect(openrouterStrategy.getThinkingConfig(config, 'high')).toEqual({ enabled: true, effort: 'high' })
    })

    it('clamps max → high (OpenRouter 无 max 档)', () => {
      const config = makeModelConfig({ provider: 'openrouter' })
      expect(openrouterStrategy.getThinkingConfig(config, 'max')).toEqual({ enabled: true, effort: 'high' })
    })

    it('disables for thinkingType none', () => {
      const config = makeModelConfig({ provider: 'openrouter', thinkingType: 'none' })
      expect(openrouterStrategy.getThinkingConfig(config, 'high')).toEqual({ enabled: false })
    })
  })

  describe('buildProviderOptions', () => {
    it('wraps thinkingConfig under openrouter.reasoning', () => {
      const config = makeModelConfig({ provider: 'openrouter' })
      expect(openrouterStrategy.buildProviderOptions({ enabled: true, effort: 'high' }, config)).toEqual({
        openrouter: { reasoning: { enabled: true, effort: 'high' } },
      })
    })
  })

  describe('createSDKProvider', () => {
    it('creates a callable provider from an API key', () => {
      const sdk = openrouterStrategy.createSDKProvider('test-key')
      expect(typeof sdk).toBe('function')
    })
  })

  describe('name', () => {
    it('is openrouter', () => {
      expect(openrouterStrategy.name).toBe('openrouter')
    })
  })
})

describe('getProviderStrategy', () => {
  it('returns google strategy for "google"', () => {
    expect(getProviderStrategy('google')).toBe(googleStrategy)
  })

  it('returns deepseek strategy for "deepseek"', () => {
    expect(getProviderStrategy('deepseek')).toBe(deepseekStrategy)
  })

  it('returns openrouter strategy for "openrouter"', () => {
    expect(getProviderStrategy('openrouter')).toBe(openrouterStrategy)
  })

  it('throws for unknown provider', () => {
    expect(() => getProviderStrategy('openai')).toThrow('Unknown AI provider: openai')
  })
})

describe('getThinkingConfig', () => {
  it('delegates to google strategy for google models', () => {
    const result = getThinkingConfig('models/gemini-3-flash-preview', 'high')
    expect(result).toEqual({
      includeThoughts: false,
      thinkingLevel: 'high',
    })
  })

  it('delegates to deepseek strategy for deepseek models', () => {
    expect(getThinkingConfig('deepseek-v4-flash', 'max')).toBe('max')
    expect(getThinkingConfig('deepseek-v4-flash', 'minimal')).toBe('disabled')
  })

  it('delegates to openrouter strategy for openrouter models', () => {
    expect(getThinkingConfig('xiaomi/mimo-v2.5', 'high')).toEqual({ enabled: true, effort: 'high' })
    expect(getThinkingConfig('xiaomi/mimo-v2.5', 'minimal')).toEqual({ enabled: false })
  })

  it('returns fallback for unknown model', () => {
    expect(getThinkingConfig('unknown-model', 'high')).toEqual({
      includeThoughts: false,
    })
  })
})
