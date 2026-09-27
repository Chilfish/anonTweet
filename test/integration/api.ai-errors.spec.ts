import type { EnrichedTweet } from '~/types'
/**
 * test/integration/api.ai-errors.spec.ts
 *
 * L2 集成层 — AC-OBS-002：AI 路由失败时必须能定位到具体实体。
 *
 * 用「路由内必然抛错的未知 provider」触发 catch：不触网、不依赖任何 key。
 * 断言响应带 targetId/targetType/model/provider，且遵守「HTTP 200 + body.status 分类」约定
 * （业务拦截不刷 Vercel error 日志，失败分类只写在 body.status）。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { loadFixture } from '../helpers/load-fixture'

const UNKNOWN_PROVIDER = 'not-a-provider'

function postAITranslation(body: unknown): Promise<Response> {
  return fetch(`${process.env.TEST_BASE_URL}/api/ai-translation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const article = {
  id: '2104009234858024962',
  url: 'https://x.com/i/article/2104009234858024962',
  title: 'タイトル',
  format: 'rich',
  blocks: [{ key: 'b1', type: 'paragraph', runs: [{ type: 'text', text: 'これはテストです。' }] }],
}

describe.skipIf(!testEnv.hasServer)('AC-OBS-002 AI failure context', () => {
  it('AC-OBS-002: article branch returns the article id, HTTP 200 with body.status 500', async () => {
    const res = await postAITranslation({
      type: 'article',
      article,
      apiKey: 'sk-test',
      model: 'deepseek-flash',
      provider: UNKNOWN_PROVIDER,
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      success: false,
      status: 500,
      targetType: 'article',
      targetId: article.id,
      model: 'deepseek-flash',
      provider: UNKNOWN_PROVIDER,
    })
    expect(body.aiError?.type).toBeTruthy()
  })

  it('AC-OBS-002: ins branch returns the ig post id', async () => {
    const res = await postAITranslation({
      type: 'ins',
      igPost: { id: 'Cxyz123', description: 'これはIGのキャプションです。' },
      enableAITranslation: true,
      force: true,
      apiKey: 'sk-test',
      model: 'deepseek-flash',
      provider: UNKNOWN_PROVIDER,
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      targetType: 'ig',
      targetId: 'Cxyz123',
      provider: UNKNOWN_PROVIDER,
    })
  })

  it('AC-OBS-002: twitter branch returns the tweet id', async () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const res = await postAITranslation({
      tweet,
      enableAITranslation: true,
      force: true,
      apiKey: 'sk-test',
      model: 'deepseek-flash',
      provider: UNKNOWN_PROVIDER,
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      targetType: 'tweet',
      targetId: tweet.id_str,
      provider: UNKNOWN_PROVIDER,
    })
  })
})
