import type { ITweetSearchResponse } from '~/lib/rettiwt-api/types/raw/tweet/Search'
/**
 * test/unit/search.spec.ts
 *
 * `${parseSearchTimeline}` 纯函数单测（AC-TWEET-009 离线部分）。
 * 解析器零测试是 postmortem #001 的最高危雷区 → 搜索解析必须直接单测。
 */
import { describe, expect, it } from 'vitest'
import { parseSearchTimeline } from '~/lib/react-tweet/utils/get-tweet'
import { TweetFilter } from '~/lib/rettiwt-api/models/args/FetchArgs'
import { loadFixture } from '../helpers/load-fixture'

const fixture = loadFixture<ITweetSearchResponse>('search/search-tweets.json')

describe('parseSearchTimeline', () => {
  it('extracts tweet entries in order and excludes non tweet- prefixes (ads)', () => {
    const { tweets } = parseSearchTimeline(fixture)

    expect(tweets).toHaveLength(2)
    expect(tweets[0]!.rest_id).toBe('1234567890123456789')
    expect(tweets[1]!.rest_id).toBe('2234567890123456789')
  })

  it('never mixes TimelineTimelineCursor entries into the tweet list', () => {
    const { tweets } = parseSearchTimeline(fixture)

    const ids = tweets.map(t => (t as { rest_id?: string }).rest_id)
    expect(ids).not.toContain(undefined)
    expect(JSON.stringify(tweets)).not.toContain('TimelineTimelineCursor')
  })

  it('returns the Bottom cursor value as nextCursor', () => {
    const { nextCursor } = parseSearchTimeline(fixture)

    expect(nextCursor).toBe('dGhlX2JvdHRvbV9jdXJzb3Jfb2Zfc2VhcmNo')
  })

  it('tolerates empty / malformed responses without throwing', () => {
    expect(parseSearchTimeline({} as ITweetSearchResponse)).toEqual({ tweets: [], nextCursor: null })
    expect(parseSearchTimeline({ data: {} } as ITweetSearchResponse)).toEqual({ tweets: [], nextCursor: null })
  })

  it('returns empty list when no TimelineAddEntries instruction exists', () => {
    const noEntries = {
      data: {
        search_by_raw_query: {
          search_timeline: {
            timeline: {
              instructions: [{ type: 'TimelineTerminateTimeline' }],
            },
          },
        },
      },
    } as unknown as ITweetSearchResponse

    expect(parseSearchTimeline(noEntries).tweets).toEqual([])
  })

  it('unwraps TweetWithVisibilityResults wrappers into the inner tweet', () => {
    const innerTweet = {
      __typename: 'Tweet',
      rest_id: '424242',
      core: { user_results: {} },
      legacy: { id_str: '424242', full_text: 'visible' },
    }
    const withVisibility = {
      data: {
        search_by_raw_query: {
          search_timeline: {
            timeline: {
              instructions: [
                {
                  type: 'TimelineAddEntries',
                  entries: [
                    {
                      entryId: 'tweet-424242',
                      content: {
                        entryType: 'TimelineTimelineItem',
                        itemContent: {
                          itemType: 'TimelineTweet',
                          tweet_results: {
                            result: {
                              __typename: 'TweetWithVisibilityResults',
                              tweet: innerTweet,
                              limitedActionResults: { limited_actions: [] },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    } as unknown as ITweetSearchResponse

    const { tweets } = parseSearchTimeline(withVisibility)

    expect(tweets).toHaveLength(1)
    expect((tweets[0] as { rest_id?: string }).rest_id).toBe('424242')
  })
})

describe('tweetFilter advanced search syntax passthrough', () => {
  it('keeps X-style advanced operator query verbatim as rawQuery', () => {
    const raw = '(from:7KoWa) until:2025-12-20'
    expect(new TweetFilter({ includeWords: [raw] }).toString()).toBe(raw)
  })

  it('joins multiple include words with spaces without mangling operators', () => {
    expect(
      new TweetFilter({ includeWords: ['hello', 'from:user1'], minLikes: 20 }).toString(),
    ).toBe('hello from:user1 min_faves:20')
  })
})
