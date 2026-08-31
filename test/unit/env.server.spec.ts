import { describe, expect, it } from 'vitest'
import { createEnv } from '~/lib/env.server'

/**
 * env.server 校验测试：直接注入合成 env 源（纯函数 createEnv），
 * 不依赖 vi.resetModules / 模块副作用 —— vitest 与 bun 原生 runner 双兼容。
 */
describe('env.server createEnv', () => {
  it('does not require TWEET_KEYS and infers HOSTNAME in development', () => {
    const mod = createEnv({
      ENVIRONMENT: 'development',
      TWEET_KEYS: '',
      PORT: '1234',
    })

    expect(mod.TWEET_KEYS).toBe('')
    expect(mod.HOSTNAME).toBe('http://localhost:1234')
  })

  it('parses string booleans', () => {
    const mod = createEnv({
      ENVIRONMENT: 'development',
      TWEET_KEYS: '',
      ENABLE_AI_TRANSLATION: 'true',
      ENABLE_DB_CACHE: '0',
    })

    expect(mod.ENABLE_AI_TRANSLATION).toBe(true)
    expect(mod.ENABLE_DB_CACHE).toBe(false)
  })

  it('defaults AI baseUrl whitelist OFF and allows host extension (AC-SEC-001)', () => {
    // 白名单默认关闭：第三方中转/自建端点零配置可用
    const def = createEnv({ ENVIRONMENT: 'development', TWEET_KEYS: '' })
    expect(def.ENABLE_AI_BASE_URL_WHITELIST).toBe(false)
    expect(def.ALLOWED_AI_BASE_URL_HOSTS).toBeUndefined()

    // 显式开启 + 扩展域名
    const hardened = createEnv({
      ENVIRONMENT: 'production',
      TWEET_KEYS: 'k',
      ENABLE_AI_BASE_URL_WHITELIST: 'true',
      ALLOWED_AI_BASE_URL_HOSTS: 'my-proxy.example.com,api.openai.com',
    })
    expect(hardened.ENABLE_AI_BASE_URL_WHITELIST).toBe(true)
    expect(hardened.ALLOWED_AI_BASE_URL_HOSTS).toBe('my-proxy.example.com,api.openai.com')
  })

  it('keeps explicit HOSTNAME when provided (no inference override)', () => {
    const mod = createEnv({
      ENVIRONMENT: 'development',
      HOSTNAME: 'https://example.test',
      PORT: '1234',
    })

    expect(mod.HOSTNAME).toBe('https://example.test')
  })

  it('defaults ENABLE_TIMELINE OFF and parses explicit true', () => {
    const def = createEnv({ ENVIRONMENT: 'development', TWEET_KEYS: '' })
    expect(def.ENABLE_TIMELINE).toBe(false)

    const enabled = createEnv({
      ENVIRONMENT: 'development',
      TWEET_KEYS: 'k',
      ENABLE_TIMELINE: 'true',
    })
    expect(enabled.ENABLE_TIMELINE).toBe(true)
  })
})
