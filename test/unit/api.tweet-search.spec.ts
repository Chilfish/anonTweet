/**
 * test/unit/api.tweet-search.spec.ts
 *
 * GET /api/tweet/search loader 单测（AC-TWEET-010 路由层）：
 * - 缺 q → 400 + 空结果
 * - 合法 q → 返回 { tweets, nextCursor }，参数透传 fetchSearchTweets
 * - 上游异常 → 结构化 error 响应
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchSearchTweetsMock = vi.fn()

vi.mock('~/lib/react-tweet/utils/get-tweet', () => ({
  fetchSearchTweets: (...args: unknown[]) => fetchSearchTweetsMock(...args),
}))

vi.mock('~/lib/react-tweet', () => ({
  enrichTweet: (tweet: unknown) => tweet,
}))

const rawTweets = [
  {
    id_str: '1',
    text: 'fixture tweet',
    lang: 'en',
    entities: [],
    user: { id_str: 'u1', screen_name: 'u1' },
  },
]

function makeSearchRequest(search: string): Request {
  return new Request(`http://localhost/api/tweet/search?${search}`)
}

describe('gET /api/tweet/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchSearchTweetsMock.mockResolvedValue({
      tweets: rawTweets,
      nextCursor: 'cursor-B',
    })
  })

  it('returns 400 + empty results when q is missing', async () => {
    const { loader } = await import('~/routes/api/tweet/search')

    const res = await loader({ request: makeSearchRequest('type=latest') } as any)

    expect(fetchSearchTweetsMock).not.toHaveBeenCalled()
    expect((res as any)?.data ?? res).toMatchObject({ tweets: [], nextCursor: null })
  })

  it('fetches with q / type / count defaults and returns tweets + nextCursor', async () => {
    const { loader } = await import('~/routes/api/tweet/search')

    const res = await loader({ request: makeSearchRequest('q=twitter') } as any)

    expect(fetchSearchTweetsMock).toHaveBeenCalledWith('twitter', {
      type: 'latest',
      count: 20,
      cursor: undefined,
    })
    expect(res).toMatchObject({
      tweets: [{ id_str: '1' }],
      nextCursor: 'cursor-B',
    })
  })

  it('passes type=top and cursor through for pagination', async () => {
    const { loader } = await import('~/routes/api/tweet/search')

    await loader({
      request: makeSearchRequest('q=twitter&type=top&cursor=cursor-B&count=10'),
    } as any)

    expect(fetchSearchTweetsMock).toHaveBeenCalledWith('twitter', {
      type: 'top',
      count: 10,
      cursor: 'cursor-B',
    })
  })

  it('rejects blank / overlong queries with 400', async () => {
    const { loader } = await import('~/routes/api/tweet/search')

    for (const badQ of ['', '   ', 'x'.repeat(501)]) {
      const res = await loader({ request: makeSearchRequest(`q=${encodeURIComponent(badQ)}`) } as any)
      expect(fetchSearchTweetsMock).not.toHaveBeenCalled()
      expect((res as any)?.data ?? res).toMatchObject({ tweets: [], nextCursor: null })
    }
  })

  it('returns a structured error response when upstream fails', async () => {
    fetchSearchTweetsMock.mockRejectedValue(new Error('Twitter 429'))

    const { loader } = await import('~/routes/api/tweet/search')

    const res = await loader({ request: makeSearchRequest('q=twitter') } as any)

    expect((res as any)?.data ?? res).toMatchObject({ error: 'Failed to search tweets' })
  })
})
