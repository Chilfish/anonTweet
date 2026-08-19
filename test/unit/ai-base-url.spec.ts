import { describe, expect, it } from 'vitest'
import {
  ALLOWED_AI_BASE_URL_HOSTS,
  getAIBaseUrlWhitelistHosts,
  isAIBaseUrlWhitelistEnabled,
  isAllowedAIBaseUrl,
} from '~/lib/ai-base-url'

/**
 * AC-SEC-001 P1：白名单语义单测（可选加固，默认关闭）。
 *
 * - 默认（未开启）：任意 baseUrl 放行——第三方中转站/自建端点可用（部署零配置）；
 * - 开启（options.enabled=true）：仅放行白名单 hostname；
 * - env 扩展（hosts 注入）：ALLOWED_AI_BASE_URL_HOSTS 与内置官方域名合并。
 */
describe('ai-base-url allowlist (AC-SEC-001)', () => {
  it('builtin allowlist covers the three known provider domains', () => {
    expect(ALLOWED_AI_BASE_URL_HOSTS).toEqual(new Set([
      'generativelanguage.googleapis.com',
      'api.deepseek.com',
      'openrouter.ai',
    ]))
  })

  it('whitelist is disabled by default (arbitrary baseUrl allowed)', () => {
    // 开关默认关闭：第三方中转站/自建端点直接可用
    expect(isAIBaseUrlWhitelistEnabled()).toBe(false)
    // 未显式开启时，任意端点均放行（含未知域名 / IP / localhost）
    expect(isAllowedAIBaseUrl('https://evil.example.com/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('https://my-proxy.example.com/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('https://192.168.1.1/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('http://localhost:11434/v1')).toBe(true)
    expect(isAllowedAIBaseUrl('http://gpu-box.internal:8000/v1')).toBe(true)
  })

  it('absent/blank baseUrl always allowed (falls back to provider defaults)', () => {
    expect(isAllowedAIBaseUrl(undefined, { enabled: true })).toBe(true)
    expect(isAllowedAIBaseUrl(null, { enabled: true })).toBe(true)
    expect(isAllowedAIBaseUrl('', { enabled: true })).toBe(true)
    expect(isAllowedAIBaseUrl('   ', { enabled: true })).toBe(true)
  })

  it('allows known provider hosts with paths and ports when enabled', () => {
    const opts = { enabled: true } as const
    expect(isAllowedAIBaseUrl('https://generativelanguage.googleapis.com/v1beta', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://api.deepseek.com/v1', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://openrouter.ai/api/v1', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://OPENROUTER.AI/api/v1', opts)).toBe(true)
  })

  it('rejects unknown domains, IPs, and suffix-spoofing hosts when enabled', () => {
    const opts = { enabled: true } as const
    expect(isAllowedAIBaseUrl('https://evil.example.com/v1', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('https://openrouter.ai.evil.com/v1', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('https://api.deepseek.com.evil.com', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('https://192.168.1.1/v1', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('http://localhost:11434/v1', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('http://gpu-box.internal:8000/v1', opts)).toBe(false)
  })

  it('rejects non-http(s) protocols and malformed input when enabled', () => {
    const opts = { enabled: true } as const
    expect(isAllowedAIBaseUrl('file://openrouter.ai/x', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('not-a-url', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('https://', opts)).toBe(false)
    expect(isAllowedAIBaseUrl('javascript:alert(1)', opts)).toBe(false)
  })

  it('merges env ALLOWED_AI_BASE_URL_HOSTS into the effective allowlist', () => {
    // 模拟部署方扩展：逗号分隔 + 大小写归一 + 空白忽略
    const hosts = getAIBaseUrlWhitelistHosts('my-proxy.example.com, ANOTHER-GATE.WAY.COM , ')
    expect(hosts).toContain('generativelanguage.googleapis.com')
    expect(hosts).toContain('my-proxy.example.com')
    expect(hosts).toContain('another-gate.way.com')

    const opts = { enabled: true, hosts } as const
    expect(isAllowedAIBaseUrl('https://my-proxy.example.com/v1', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://another-gate.way.com/v1', opts)).toBe(true)
    expect(isAllowedAIBaseUrl('https://my-proxy.example.com.evil.com/v1', opts)).toBe(false)
  })

  it('empty env extension keeps only the builtin set', () => {
    const hosts = getAIBaseUrlWhitelistHosts('')
    expect(hosts).toEqual(ALLOWED_AI_BASE_URL_HOSTS)
  })
})
