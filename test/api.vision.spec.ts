import { describe, expect, it } from 'vitest'

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/ai-vision', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/ai-vision', () => {
  it('rejects invalid payload (missing apiKey)', async () => {
    const { action } = await import('~/routes/api/ai/vision')

    const res = await action({ request: jsonRequest({ tweet: { id_str: '1', text: 'x' }, mediaIndexes: [0], mode: 'describe' }) } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({ success: false, status: 400 })
  })

  it('rejects non-JSON body', async () => {
    const { action } = await import('~/routes/api/ai/vision')

    const req = new Request('http://localhost/api/ai-vision', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not json',
    })
    const res = await action({ request: req } as any)
    const payload = (res as any)?.data ?? res
    expect(payload).toMatchObject({ success: false, status: 400 })
  })

  it('no-photo tweet → success with empty visionInfo (offline, no model call)', async () => {
    const { action } = await import('~/routes/api/ai/vision')

    const res = await action({ request: jsonRequest({
      tweet: { id_str: '1', text: 'no photo', mediaDetails: [] },
      mediaIndexes: [0],
      mode: 'describe',
      apiKey: 'bogus-key',
      model: 'xiaomi/mimo-v2.5',
      provider: 'openrouter',
    }) } as any)
    const payload = (res as any)?.data ?? res
    expect(payload.success).toBe(true)
    expect(payload.data.visionInfo).toEqual([])
  })
})
