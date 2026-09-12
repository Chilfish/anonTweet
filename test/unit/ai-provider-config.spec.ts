import type { AIProvider } from '~/lib/stores/appConfig'
import { describe, expect, it } from 'vitest'
import { IMAGE_CAPABLE_PROVIDERS, resolveVisionConfig } from '~/lib/ai-provider-config'
import { models } from '~/lib/constants'

const baseConfig = {
  geminiApiKey: 'gemini-key',
  geminiModel: 'models/gemini-3-flash-preview',
  geminiBaseUrl: '',
  geminiThinkingLevel: 'minimal',
  deepseekApiKey: 'deepseek-key',
  deepseekModel: 'deepseek-flash',
  deepseekBaseUrl: '',
  deepseekThinkingLevel: 'high',
  openrouterApiKey: 'openrouter-key',
  openrouterModel: 'xiaomi/mimo-v2.5',
  openrouterBaseUrl: '',
  openrouterThinkingLevel: 'minimal',
} as const

describe('AC-VISION-013: DeepSeek is an image-capable vision provider', () => {
  it('lists deepseek among image-capable providers', () => {
    expect(IMAGE_CAPABLE_PROVIDERS).toContain('deepseek')
  })

  it('resolves deepseek vision config to the configured deepseek model', () => {
    const resolved = resolveVisionConfig({ ...baseConfig, visionProvider: 'deepseek' })
    expect(resolved).toMatchObject({
      provider: 'deepseek',
      apiKey: 'deepseek-key',
      model: 'deepseek-flash',
      providerName: 'DeepSeek',
    })
  })

  it('still rejects providers without image input support', () => {
    expect(() => resolveVisionConfig({ ...baseConfig, visionProvider: 'openai' as AIProvider }))
      .toThrow('does not support image input')
  })
})

describe('AC-VISION-013: DeepSeek model registry follows upstream docs', () => {
  it('uses the documented slugs and drops the retired names', () => {
    const names = models.map(m => m.name)
    expect(names).toContain('deepseek-flash')
    expect(names).toContain('deepseek-v4-pro')
    expect(names).not.toContain('deepseek-v4-flash')
    expect(names).not.toContain('deepseek v4 pro')
  })

  it('marks only deepseek-flash as image-capable among deepseek models', () => {
    const deepseekModels = models.filter(m => m.provider === 'deepseek')
    expect(deepseekModels.find(m => m.name === 'deepseek-flash')?.supportsVision).toBe(true)
    expect(deepseekModels.find(m => m.name === 'deepseek-v4-pro')?.supportsVision).toBe(false)
  })
})
