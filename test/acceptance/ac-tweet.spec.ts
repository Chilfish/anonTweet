import type { ITweetSearchResponse } from '~/lib/rettiwt-api/types/raw/tweet/Search'
import type { EnrichedTweet, Entity } from '~/types'
/**
 * test/acceptance/ac-tweet.spec.ts
 *
 * L3 AC 语义层 — Tweet 离线验收：
 * - AC-TWEET-001~004 / 007：**fixture 作输入 → 调真实纯函数 → 断言产出**（F8 去「fixture 自证」，
 *   review-2026-09-11 P2-1：原实现直接断言 fixture JSON 自身字段，解析回归不会红）
 * - AC-TWEET-009：真实 `parseSearchTimeline`
 * - AC-TWEET-005/006/008/010 为集成测试，见 test/integration/api.tweet.spec.ts
 */
import { describe, expect, it } from 'vitest'
import { parseSearchTimeline } from '~/lib/react-tweet/utils/get-tweet'
import { stripTranslationsFromTweets } from '~/lib/stores/logic'
import { mergeEntityTranslationsByIndex } from '~/lib/translation/resolveEntities'
import { loadFixture } from '../helpers/load-fixture'

const fixtures = [
  'tweets/normal-ja.json',
  'tweets/with-card-ja.json',
  'tweets/with-quoted-ja.json',
] as const

type TweetWithAI = EnrichedTweet & { autoTranslationEntities?: Entity[] }

function hasEntityType(entities: Entity[], type: Entity['type']): boolean {
  return entities.some(e => e.type === type)
}

function hasDuplicateEntities(entities: Entity[]): boolean {
  const seen = new Set<string>()
  for (const e of entities) {
    const key = `${e.type}::${e.index}`
    if (seen.has(key))
      return true
    seen.add(key)
  }
  return false
}

describe('AC-TWEET tweet parsing (fixture → real pipeline)', () => {
  it('AC-TWEET-001: merging AI entities keeps hashtag + applies translations by index', () => {
    const tweet = loadFixture<TweetWithAI>('tweets/normal-ja.json')
    const base = tweet.entities ?? []
    const ai = tweet.autoTranslationEntities ?? []

    const merged = mergeEntityTranslationsByIndex(base, ai)

    // 断言解析/合并**产出**，而非 fixture 自身
    expect(hasEntityType(merged, 'hashtag')).toBe(true)
    expect(merged).toHaveLength(base.length)
    expect(merged.some(e => typeof e.translation === 'string' && e.translation.length > 0)).toBe(true)
    for (const e of merged)
      expect(e.index).toBeGreaterThanOrEqual(-1)
  })

  it('AC-TWEET-002: stripping translations preserves card + url entity href', () => {
    const tweet = loadFixture<EnrichedTweet & { card?: unknown }>('tweets/with-card-ja.json')

    const [cleaned] = stripTranslationsFromTweets([tweet])
    const entities = cleaned!.entities ?? []

    expect(cleaned!.card).toBeTruthy()
    expect(hasEntityType(entities, 'url')).toBe(true)
    for (const e of entities.filter(e => e.type === 'url'))
      expect((e as { href?: string }).href).toBeTruthy()
  })

  it('AC-TWEET-003: stripping translations preserves quoted tweet entities', () => {
    const tweet = loadFixture<EnrichedTweet & { quotedTweet?: EnrichedTweet }>('tweets/with-quoted-ja.json')

    const [cleaned] = stripTranslationsFromTweets([tweet])

    expect(cleaned!.quotedTweet).toBeTruthy()
    expect(cleaned!.quotedTweet!.entities?.length).toBeGreaterThan(0)
  })

  it('AC-TWEET-004: entity text segments reconstruct the display range (prefix invariant)', () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const text = tweet.text ?? ''
    const ordered = [...(tweet.entities ?? [])].sort((a, b) => a.index - b.index)
    const joined = ordered.map(e => e.text ?? '').join('')

    expect(text.length).toBeGreaterThan(0)
    expect(joined.length).toBeGreaterThan(0)
    // 实体文本按 index 顺序无缝拼成正文前缀（尾部被自动链接的 URL 不计入实体）
    expect(text.startsWith(joined)).toBe(true)
    for (let i = 1; i < ordered.length; i++)
      expect(ordered[i]!.index).toBeGreaterThan(ordered[i - 1]!.index)
  })

  it('AC-TWEET-007: merge by index never produces duplicate entities', () => {
    const failures: string[] = []
    for (const file of fixtures) {
      const tweet = loadFixture<TweetWithAI>(file)
      const base = tweet.entities ?? []
      const ai = tweet.autoTranslationEntities ?? []
      const merged = ai.length > 0 ? mergeEntityTranslationsByIndex(base, ai) : base
      if (hasDuplicateEntities(merged))
        failures.push(file)
    }
    expect(failures).toEqual([])
  })

  it('AC-TWEET-009: search response parses tweets + bottom cursor, excluding cursors/ads', () => {
    const response = loadFixture<ITweetSearchResponse>('search/search-tweets.json')
    const { tweets, nextCursor } = parseSearchTimeline(response)

    // fixture 含 2 条 tweet- 前缀推文 + 1 条 promoted- 广告 + Top/Bottom 光标
    expect(tweets).toHaveLength(2)
    for (const tweet of tweets) {
      expect((tweet as { rest_id?: string }).rest_id).toBeTruthy()
    }
    expect(JSON.stringify(tweets)).not.toContain('TimelineTimelineCursor')
    expect(nextCursor).toBe('dGhlX2JvdHRvbV9jdXJzb3Jfb2Zfc2VhcmNo')
  })
})
