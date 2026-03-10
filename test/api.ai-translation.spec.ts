import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/AITranslation', () => ({
  autoTranslateTweet: vi.fn(async () => ([
    { type: 'text', text: 'x', index: 0, translation: 'y' },
  ])),
}))

describe('/api/ai/ai-translation', () => {
  it('returns 404 when tweet is missing', async () => {
    const { action } = await import('~/routes/api/ai/ai-translation')

    const req = new Request('http://localhost/api/ai/ai-translation', {
      method: 'POST',
      body: JSON.stringify({
        tweet: null,
        enableAITranslation: true,
        apiKey: 'k',
        model: 'm',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({ success: false, status: 404 })
  })

  it('returns 400 when apiKey/model missing', async () => {
    const { action } = await import('~/routes/api/ai/ai-translation')

    const req = new Request('http://localhost/api/ai/ai-translation', {
      method: 'POST',
      body: JSON.stringify({
        tweet: { id_str: '1', lang: 'en' },
        enableAITranslation: true,
        apiKey: '',
        model: '',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({ success: false, status: 400 })
  })

  it('returns success payload when translation succeeds', async () => {
    const { action } = await import('~/routes/api/ai/ai-translation')

    const req = new Request('http://localhost/api/ai/ai-translation', {
      method: 'POST',
      body: JSON.stringify({
        tweet: { id_str: '1', lang: 'en', text: 'a', entities: [] },
        enableAITranslation: true,
        apiKey: 'k',
        model: 'm',
        translationGlossary: '',
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await action({ request: req } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({
      success: true,
      data: { tweetId: '1' },
    })
    expect(payload.data.autoTranslationEntities?.length).toBe(1)
  })
})
