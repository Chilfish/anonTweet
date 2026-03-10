import { describe, expect, it, vi } from 'vitest'

describe('env.server', () => {
  it('does not require TWEET_KEYS and infers HOSTNAME in development', async () => {
    vi.resetModules()

    process.env.VITEST = '1'
    process.env.DOTENV_CONFIG_PATH = `${process.cwd()}/tmp/__missing__.env`
    process.env.DOTENV_CONFIG_QUIET = 'true'
    process.env.ENVIRONMENT = 'development'
    process.env.TWEET_KEYS = ''
    process.env.PORT = '1234'
    delete process.env.HOSTNAME

    const mod = await import('~/lib/env.server')
    expect(mod.env.TWEET_KEYS).toBe('')
    expect(mod.env.HOSTNAME).toBe('http://localhost:1234')
  })

  it('parses string booleans', async () => {
    vi.resetModules()

    process.env.VITEST = '1'
    process.env.DOTENV_CONFIG_PATH = `${process.cwd()}/tmp/__missing__.env`
    process.env.DOTENV_CONFIG_QUIET = 'true'
    process.env.ENVIRONMENT = 'development'
    process.env.TWEET_KEYS = ''
    process.env.ENABLE_AI_TRANSLATION = 'true'
    process.env.ENABLE_DB_CACHE = '0'

    const mod = await import('~/lib/env.server')
    expect(mod.env.ENABLE_AI_TRANSLATION).toBe(true)
    expect(mod.env.ENABLE_DB_CACHE).toBe(false)
  })
})
