import { describe, expect, it } from 'vitest'
import {
  ALLOWED_AI_BASE_URL_HOSTS,
  isAllowedAIBaseUrl,
} from '~/lib/ai-base-url'

/**
 * AC-SEC-001 P1：白名单语义单测。
 */
describe('ai-base-url allowlist (AC-SEC-001)', () => {
  it('allowlist covers the three known provider domains', () => {
    expect(ALLOWED_AI_BASE_URL_HOSTS).toEqual(new Set([
      'generativelanguage.googleapis.com',
      'api.deepseek.com',
      'openrouter.ai',
    ]))
  })

  it('allows absent/blank baseUrl (falls back to provider defaults)', () => {
    expect(isAllowedAIBaseUrl(undefined)).toBe(true)
    expect(isAllowedAIBaseUrl(null)).toBe(true)
    expect(isAllowedAIBaseUrl('')).toBe(true)
    expect(isAllowedAIBaseUrl('   ')).toBe(true)
  })

  it('allows known provider hosts with paths and ports', () => {
    expect(isAllowedAIBaseUrl('https://generativelanguage.googleapis.com/v1beta')).toBe(true)
    expect(isAllowedAIBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions')).toBe(true)
    expect(isAllowedAIBaseUrl('https://api.deepseek.com/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('https://openrouter.ai/api/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('https://OPENROUTER.AI/api/v1')).toBe(true)
  })

  it('rejects unknown domains, IPs, and suffix-spoofing hosts', () => {
    expect(isAllowedAIBaseUrl('https://evil.example.com/v1')).toBe(false)
    expect(isAllowedAIBaseUrl('https://openrouter.ai.evil.com/v1')).toBe(false)
    expect(isAllowedAIBaseUrl('https://api.deepseek.com.evil.com')).toBe(false)
    expect(isAllowedAIBaseUrl('https://192.168.1.1/v1')).toBe(false)
    expect(isAllowedAIBaseUrl('http://localhost:11434/v1')).toBe(false)
  })

  it('rejects non-http(s) protocols and malformed input', () => {
    expect(isAllowedAIBaseUrl('file://openrouter.ai/x')).toBe(false)
    expect(isAllowedAIBaseUrl('not-a-url')).toBe(false)
    expect(isAllowedAIBaseUrl('https://')).toBe(false)
    expect(isAllowedAIBaseUrl('javascript:alert(1)')).toBe(false)
  })
})
