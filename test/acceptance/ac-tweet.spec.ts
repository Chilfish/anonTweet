import type { ITweetSearchResponse } from '~/lib/rettiwt-api/types/raw/tweet/Search'
import type { EnrichedTweet, Entity } from '~/types'
/**
 * test/acceptance/ac-tweet.spec.ts
 *
 * L3 AC 语义层 — Tweet 离线验收（自 verify/modules/tweet.verifier.ts 迁移，Phase B 去重）：
 * AC-TWEET-001~004 / 007（fixture 回归）；AC-TWEET-005/006/008 为集成测试，
 * 迁至 test/integration/（Phase C）。AC-TWEET-009（搜索解析，离线）同处本文件。
 */
import { describe, expect, it } from 'vitest'
import { parseSearchTimeline } from '~/lib/react-tweet/utils/get-tweet'
import { loadFixture } from '../helpers/load-fixture'

const NON_WHITESPACE_START_RE = /^\S/
const NON_WHITESPACE_END_RE = /\S$/

const fixtures = [
  'tweets/normal-ja.json',
  'tweets/with-card-ja.json',
  'tweets/with-quoted-ja.json',
] as const

function hasEntityType(entities: Entity[], type: string): boolean {
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

describe('AC-TWEET tweet parsing (fixture regression)', () => {
  it('AC-TWEET-001: normal tweet has valid entities with hashtag', () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const entities = tweet.entities || []

    expect(entities.length).toBeGreaterThanOrEqual(2)
    expect(hasEntityType(entities, 'hashtag')).toBe(true)
    for (const e of entities)
      expect((e.index ?? -1)).toBeGreaterThanOrEqual(0)
  })

  it('AC-TWEET-002: card tweet has url entity with href and card', () => {
    const tweet = loadFixture<EnrichedTweet & { card?: unknown }>('tweets/with-card-ja.json')
    const entities = tweet.entities || []

    expect(hasEntityType(entities, 'url')).toBe(true)
    expect(tweet.card).toBeTruthy()
    for (const e of entities.filter(e => e.type === 'url'))
      expect(e.href).toBeTruthy()
  })

  it('AC-TWEET-003: quoted tweet preserves quoted entities', () => {
    const tweet = loadFixture<EnrichedTweet & { quotedTweet?: EnrichedTweet }>('tweets/with-quoted-ja.json')

    expect(tweet.quotedTweet).toBeTruthy()
    expect(tweet.quotedTweet!.entities?.length).toBeGreaterThan(0)
  })

  it('AC-TWEET-004: text display range starts/ends with visible chars', () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const text = tweet.text || ''

    expect(text.trimStart()).toMatch(NON_WHITESPACE_START_RE)
    expect(text.trimEnd()).toMatch(NON_WHITESPACE_END_RE)
    expect(text.trim().length).toBeGreaterThan(0)
  })

  it('AC-TWEET-007: no duplicate entities across all tweet fixtures', () => {
    const failures: string[] = []
    for (const file of fixtures) {
      const tweet = loadFixture<EnrichedTweet>(file)
      if (hasDuplicateEntities(tweet.entities || []))
        failures.push(file)
      if (tweet.quotedTweet && hasDuplicateEntities(tweet.quotedTweet.entities || []))
        failures.push(`${file} (quoted)`)
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
