import { describe, expect, it, vi } from 'vitest'
import { deepseekStrategy, googleStrategy } from '~/lib/providers'

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(
    (options: { apiKey?: string, baseURL?: string }) =>
      Object.assign(() => {}, { __settings: options }),
  ),
}))

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: vi.fn(
    (options: {
      apiKey?: string
      baseURL: string
      name: string
      transformRequestBody?: (body: Record<string, any>) => Record<string, any>
    }) => Object.assign(() => {}, { __settings: options }),
  ),
}))

describe('createSDKProvider baseUrl forwarding', () => {
  it('passes baseURL to the Google SDK when provided', () => {
    const sdk = googleStrategy.createSDKProvider('key', 'https://custom.example/v1beta') as any
    expect(sdk.__settings.baseURL).toBe('https://custom.example/v1beta')
    expect(sdk.__settings.apiKey).toBe('key')
  })

  it('omits baseURL for Google when empty', () => {
    const sdk = googleStrategy.createSDKProvider('key', '') as any
    expect(sdk.__settings.baseURL).toBeUndefined()
  })

  it('passes baseURL to the DeepSeek SDK when provided', () => {
    const sdk = deepseekStrategy.createSDKProvider('key', 'https://deepseek.example') as any
    expect(sdk.__settings.baseURL).toBe('https://deepseek.example')
    expect(sdk.__settings.name).toBe('deepseek')
  })

  it('defaults to the official DeepSeek base URL when empty', () => {
    const sdk = deepseekStrategy.createSDKProvider('key', '') as any
    expect(sdk.__settings.baseURL).toBe('https://api.deepseek.com')
  })

  it('injects thinking disabled when reasoning_effort is absent', () => {
    const sdk = deepseekStrategy.createSDKProvider('key', '') as any
    const transform = sdk.__settings.transformRequestBody as (body: Record<string, any>) => Record<string, any>
    expect(transform({ model: 'deepseek-v4-flash', messages: [] })).toEqual({
      model: 'deepseek-v4-flash',
      messages: [],
      thinking: { type: 'disabled' },
    })
  })

  it('leaves body unchanged when reasoning_effort is present', () => {
    const sdk = deepseekStrategy.createSDKProvider('key', '') as any
    const transform = sdk.__settings.transformRequestBody as (body: Record<string, any>) => Record<string, any>
    const body = { model: 'deepseek-v4-flash', reasoning_effort: 'high', messages: [] }
    expect(transform(body)).toBe(body)
  })

  it('trims surrounding whitespace from baseUrl', () => {
    const sdk = googleStrategy.createSDKProvider('key', '  https://custom.example  ') as any
    expect(sdk.__settings.baseURL).toBe('https://custom.example')
  })
})
