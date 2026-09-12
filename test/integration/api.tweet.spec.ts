import type { EnrichedTweet } from '~/types'
/**
 * test/integration/api.tweet.spec.ts
 *
 * L2 集成层 — Tweet API（自 verify/modules/tweet.verifier.ts 集成 AC 迁移，Phase C）：
 * AC-TWEET-005（端点返回推文，需 TWEET_KEYS）/ 006（无效 ID → 空）/ 008（GET/POST 一致性，需 TWEET_KEYS）。
 * 隔离环境下 TWEET_KEYS 被清空 → 005/008 skipIf，006 确定性可跑。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { loadFixture } from '../helpers/load-fixture'
import { getClient } from '../helpers/test-context'

const HTTP_ERROR_RE = /HTTP [45]\d{2}/

describe.skipIf(!testEnv.hasServer || !testEnv.hasTweetKeys)('AC-TWEET-005/008 tweet API (needs TWEET_KEYS + server)', () => {
  it('AC-TWEET-005: API endpoint returns tweet', async () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const result = await getClient().tweet.get({ tweetId: tweet.id_str })

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]!.id_str).toBeTruthy()
  })

  it('AC-TWEET-008: GET/POST consistency', async () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const [postResult, getResult] = await Promise.all([
      getClient().tweet.get({ tweetId: tweet.id_str }),
      getClient().tweet.getById(tweet.id_str),
    ])

    expect(postResult[0]!.id_str).toBe(getResult[0]!.id_str)
  })
})

describe.skipIf(!testEnv.hasServer)('AC-TWEET-006 invalid tweet', () => {
  it('AC-TWEET-006: invalid tweet id yields [] or a clean HTTP error (never a silent pass)', async () => {
    // F7：原实现 `try { … } catch { return }`——抛错也算过，半恒真。
    // 现要求两种可接受结果之一，任何其它结果（非空数组 / 非 HTTP 错误）都判失败。
    const outcome = await getClient()
      .tweet
      .get({ tweetId: '__nonexistent__12345' })
      .then(result => (Array.isArray(result) && result.length === 0
        ? 'empty'
        : `unexpected-result:${JSON.stringify(result).slice(0, 80)}`))
      .catch((error: unknown) => (error instanceof Error && HTTP_ERROR_RE.test(error.message)
        ? 'http-error'
        : `unexpected-error:${String(error)}`))

    expect(['empty', 'http-error']).toContain(outcome)
  })
})

describe.skipIf(!testEnv.hasServer || !testEnv.hasTweetKeys)('AC-TWEET-010 tweet search API (needs TWEET_KEYS + server)', () => {
  it('AC-TWEET-010: search endpoint returns paginated tweet list', async () => {
    const result = await getClient().tweet.search({ q: 'twitter', type: 'latest', count: 5 })

    // 分页形态：{ tweets, nextCursor: string | null }
    expect(result).toHaveProperty('tweets')
    expect(result).toHaveProperty('nextCursor')
    expect(Array.isArray(result.tweets)).toBe(true)
    expect(result.nextCursor === null || typeof result.nextCursor === 'string').toBe(true)

    // 元素格式同 /api/tweet/get（EnrichedTweet）
    for (const tweet of result.tweets) {
      expect(tweet.id_str).toBeTruthy()
      expect(tweet.text).toBeTruthy()
      expect(Array.isArray(tweet.entities)).toBe(true)
      expect(tweet.user?.screen_name).toBeTruthy()
    }
  })
})
