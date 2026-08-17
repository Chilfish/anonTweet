import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/service/getTweet', () => ({
  getTweets: vi.fn(async () => ([
    { id_str: '1', lang: 'en', entities: [], user: { screen_name: 'u' } },
  ])),
}))

vi.mock('~/lib/service/getTweet.server', () => ({
  getLocalTweet: vi.fn(async () => null),
  insertToTweetDB: vi.fn(async () => {}),
}))

describe('/api/tweet/get/:id', () => {
  it('returns 400 on invalid payload', async () => {
    const { action } = await import('~/routes/api/tweet/get')

    const req = new Request('http://localhost/api/tweet/get/1', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({ success: false, status: 400 })
  })

  it('returns tweet list on valid payload', async () => {
    const { action } = await import('~/routes/api/tweet/get')

    const req = new Request('http://localhost/api/tweet/get/1', {
      method: 'POST',
      body: JSON.stringify({
        tweetId: '1',
        enableAITranslation: false,
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    expect(Array.isArray(res)).toBe(true)
    expect((res as any[])[0]).toMatchObject({ id_str: '1' })
  })

  it('returns tweets without inline AI translation even when enableAITranslation is true (AC-DECOUPLE-001)', async () => {
    const { action } = await import('~/routes/api/tweet/get')

    const req = new Request('http://localhost/api/tweet/get/1', {
      method: 'POST',
      body: JSON.stringify({
        tweetId: '1',
        enableAITranslation: true,
        apiKey: 'k',
        model: 'm',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    expect(Array.isArray(res)).toBe(true)
    const tweet = (res as any[])[0]
    // 解耦后 GET 不注入 aiTranslation（翻译走 /api/ai-translation）
    expect(tweet.entities).toEqual([])
  })
})
