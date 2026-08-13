import { describe, expect, it, vi } from 'vitest'
import { deepseekStrategy, googleStrategy } from '~/lib/providers'

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(
    (options: { apiKey?: string, baseURL?: string }) =>
      Object.assign(() => {}, { __settings: options }),
  ),
}))

vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(
    (options: { apiKey?: string, baseURL?: string }) =>
      Object.assign(() => {}, { __settings: options }),
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
  })

  it('trims surrounding whitespace from baseUrl', () => {
    const sdk = googleStrategy.createSDKProvider('key', '  https://custom.example  ') as any
    expect(sdk.__settings.baseURL).toBe('https://custom.example')
  })
})
