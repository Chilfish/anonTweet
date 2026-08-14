import type { RawTweet } from '~/types'
/**
 * test/unit/parseTweet.spec.ts
 *
 * P0 补缺（docs/planning/testing-infra-refactor.md Phase B / AC-TEST-006）：
 * postmortem #001 高危表榜首 parseTweet.ts（10 次 fix）此前零覆盖。
 *
 * 覆盖：enrichTweet（note_tweet 优先 / Tombstone / retweet 递归）、
 * transformUserResponse、mapTwitterCard（summary/player/unified_card/兜底）、
 * mapMediaDetails（photo/gif/video/无 media）。
 */
import { describe, expect, it } from 'vitest'
import {
  enrichTweet,
  mapMediaDetails,
  mapTwitterCard,
  transformUserResponse,
} from '~/lib/react-tweet/utils/parseTweet'

// ─── Factory: minimal RawTweet ───────────────────────────────

interface RawTweetFactory {
  restId?: string
  text?: string
  noteText?: string
  lang?: string
  typename?: string
  hasUser?: boolean
  card?: unknown
  media?: Array<Partial<{
    id_str: string
    media_url_https: string
    type: string
    ext_alt_text: string
    original_info: { width: number, height: number }
    video_info: { duration_millis: number, aspect_ratio: number[], variants: Array<{ content_type: string, url: string, bitrate?: number }> }
  }>>
  entities?: {
    hashtags?: unknown[]
    user_mentions?: unknown[]
    urls?: unknown[]
    symbols?: unknown[]
  }
}

function makeRawTweet(opts: RawTweetFactory = {}): RawTweet {
  const {
    restId = '123',
    text = 'hello world',
    noteText,
    lang = 'en',
    typename = 'Tweet',
    hasUser = true,
    card,
    media,
    entities = {},
  } = opts

  const user = hasUser
    ? {
        rest_id: 'user1',
        is_blue_verified: true,
        profile_image_shape: 'Circle',
        verification: { verified_type: 'Business' },
        avatar: { image_url: 'https://pbs.twimg.com/profile_images/123_abc_normal.jpg' },
        core: { name: 'Alice', screen_name: 'alice' },
        legacy: { verified: true },
      }
    : null

  return {
    __typename: typename,
    rest_id: restId,
    core: { user_results: { result: user } },
    legacy: {
      lang,
      full_text: text,
      created_at: '2026-01-01T00:00:00.000Z',
      in_reply_to_status_id_str: undefined,
      entities: {
        hashtags: entities.hashtags ?? [],
        user_mentions: entities.user_mentions ?? [],
        urls: entities.urls ?? [],
        symbols: entities.symbols ?? [],
        media: media ?? [],
      },
      extended_entities: media ? { media } : undefined,
    },
    note_tweet: noteText
      ? {
          note_tweet_results: {
            result: {
              text: noteText,
              entity_set: { hashtags: [], user_mentions: [], urls: [], symbols: [] },
            },
          },
        }
      : undefined,
    card,
  } as unknown as RawTweet
}

// ─── enrichTweet ─────────────────────────────────────────────

describe('enrichTweet', () => {
  it('AC-TEST-006: enriches a minimal tweet with url/user/entities', () => {
    const tweet = enrichTweet(makeRawTweet({ text: 'hello @alice #test' }))
    expect(tweet).not.toBeNull()
    expect(tweet!.id_str).toBe('123')
    expect(tweet!.url).toBe('https://twitter.com/alice/status/123')
    expect(tweet!.text).toBe('hello @alice #test')
    expect(tweet!.user?.screen_name).toBe('alice')
    expect(Array.isArray(tweet!.entities)).toBe(true)
  })

  it('AC-TEST-006: prefers note_tweet text over legacy full_text', () => {
    const tweet = enrichTweet(makeRawTweet({ text: 'short', noteText: 'long note text here' }))
    expect(tweet!.text).toBe('long note text here')
    expect(tweet!.isInlineMeida).toBe(false)
  })

  it('AC-TEST-006: returns null for TweetTombstone', () => {
    expect(enrichTweet(makeRawTweet({ typename: 'TweetTombstone' }))).toBeNull()
  })

  it('AC-TEST-006: returns null when user data is missing', () => {
    expect(enrichTweet(makeRawTweet({ hasUser: false }))).toBeNull()
  })

  it('AC-TEST-006: unwraps retweeted_status_result recursively', () => {
    const inner = makeRawTweet({ restId: '456', text: 'inner tweet' })
    const outer = makeRawTweet({
      restId: '789',
      text: 'outer tweet',
    })
    // Rebuild outer with the retweet field attached
    ;(outer.legacy as any).retweeted_status_result = { result: inner }
    ;(outer.legacy as any).id_str = '789'
    const tweet = enrichTweet(outer)
    expect(tweet!.id_str).toBe('456')
    expect(tweet!.retweetedOrignalId).toBe('789')
  })
})

// ─── transformUserResponse ───────────────────────────────────

describe('transformUserResponse', () => {
  it('AC-TEST-006: transforms user fields and strips _normal from avatar', () => {
    const raw = makeRawTweet()
    const user = transformUserResponse(raw)
    expect(user!.screen_name).toBe('alice')
    expect(user!.is_blue_verified).toBe(true)
    expect(user!.profile_image_url_https).toBe('https://pbs.twimg.com/profile_images/123_abc.jpg')
  })

  it('AC-TEST-006: returns null when core/legacy missing', () => {
    expect(transformUserResponse({ __typename: 'Tweet' } as RawTweet)).toBeNull()
  })
})

// ─── mapTwitterCard ──────────────────────────────────────────

function cardWith(bindings: Record<string, any>, name = 'summary', url?: string) {
  return {
    legacy: { name, url, binding_values: Object.entries(bindings).map(([key, value]) => ({ key, value })) },
  }
}

describe('mapTwitterCard', () => {
  it('AC-TEST-006: extracts summary card fields', () => {
    const card = mapTwitterCard(cardWith({
      title: { string_value: 'The Title' },
      description: { string_value: 'A description' },
      domain: { string_value: 'example.com' },
      card_url: { string_value: 'https://example.com' },
      thumbnail_image: { image_value: { url: 'https://example.com/img.jpg' } },
    }))
    expect(card).toMatchObject({
      type: 'summary',
      title: 'The Title',
      description: 'A description',
      domain: 'example.com',
      url: 'https://example.com',
      imageUrl: 'https://example.com/img.jpg',
    })
  })

  it('AC-TEST-006: maps player card to summary_large_image', () => {
    const card = mapTwitterCard(cardWith({ title: { string_value: 'Video' } }, 'player'))
    expect(card!.type).toBe('summary_large_image')
  })

  it('AC-TEST-006: parses unified_card JSON payload', () => {
    const unified = JSON.stringify({
      component_objects: { details_1: { data: { title: { content: 'YT Video' }, subtitle: { content: 'youtube.com' } } } },
      destination_objects: { browser_1: { data: { url_data: { url: 'https://youtu.be/abc' } } } },
      media_entities: { m1: { media_url_https: 'https://img.youtube.com/vi/abc/hqdefault.jpg' } },
    })
    const card = mapTwitterCard(cardWith({ unified_card: { string_value: unified } }, 'unified_card'))
    expect(card).toMatchObject({
      type: 'unified_card',
      title: 'YT Video',
      domain: 'youtube.com',
      url: 'https://youtu.be/abc',
      imageUrl: 'https://img.youtube.com/vi/abc/hqdefault.jpg',
    })
  })

  it('AC-TEST-006: returns undefined for card without title/description/image', () => {
    expect(mapTwitterCard(cardWith({}))).toBeUndefined()
  })

  it('AC-TEST-006: falls back to URL hostname for domain', () => {
    const card = mapTwitterCard(cardWith({ title: { string_value: 'T' } }, 'summary', 'https://github.com/foo'))
    expect(card!.domain).toBe('github.com')
  })
})

// ─── mapMediaDetails ─────────────────────────────────────────

describe('mapMediaDetails', () => {
  const baseMedia = (over: Record<string, any>) => ({
    id_str: 'm1',
    media_url_https: 'https://pbs.twimg.com/media/1.jpg',
    original_info: { width: 100, height: 50 },
    indices: [0, 0],
    ...over,
  })

  it('AC-TEST-006: maps photo media with alt text', () => {
    const details = mapMediaDetails(makeRawTweet({
      media: [baseMedia({ type: 'photo', ext_alt_text: 'A cat' })],
    }))
    expect(details).toEqual([
      {
        index: 0,
        media_url_https: 'https://pbs.twimg.com/media/1.jpg',
        original_info: { height: 50, width: 100 },
        type: 'photo',
        ext_alt_text: 'A cat',
      },
    ])
  })

  it('AC-TEST-006: maps animated_gif with video_info', () => {
    const details = mapMediaDetails(makeRawTweet({
      media: [baseMedia({
        type: 'animated_gif',
        video_info: {
          duration_millis: 1000,
          aspect_ratio: [1, 1],
          variants: [{ content_type: 'video/mp4', url: 'https://x.com/gif.mp4' }],
        },
      })],
    }))
    expect(details![0]).toMatchObject({ type: 'animated_gif', video_info: { duration: 1000, aspect_ratio: [1, 1] } })
  })

  it('AC-TEST-006: maps video keeping only the last variant', () => {
    const details = mapMediaDetails(makeRawTweet({
      media: [baseMedia({
        type: 'video',
        video_info: {
          duration_millis: 2000,
          aspect_ratio: [16, 9],
          variants: [
            { content_type: 'application/x-mpegURL', url: 'https://x.com/hls.m3u8' },
            { content_type: 'video/mp4', url: 'https://x.com/720.mp4', bitrate: 832000 },
          ],
        },
      })],
    }))
    expect(details![0]).toMatchObject({ type: 'video' })
    const first = details![0]
    // MediaDetails 联合未以 type 字面量作判别式，显式断言 video_info 形状
    const videoInfo = (first as { video_info?: { variants?: Array<{ url?: string }> } }).video_info
    expect(videoInfo?.variants).toHaveLength(1)
    expect(videoInfo?.variants?.[0]?.url).toBe('https://x.com/720.mp4')
  })

  it('AC-TEST-006: returns undefined when no media', () => {
    expect(mapMediaDetails(makeRawTweet())).toBeUndefined()
  })
})
