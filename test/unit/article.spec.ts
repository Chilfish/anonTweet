import type { Entity, RawTweet } from '~/types'
/**
 * test/unit/article.spec.ts
 *
 * 文章型推文（X Article）解析：正文只在 `article.article_results.result` 里，
 * 且需请求侧开启 `withArticlePlainText` 才带全文（见 AC-TWEET-012 / 013）。
 */
import { describe, expect, it } from 'vitest'
import { extractArticleIdFromUrl, isArticleUrl, mapArticle, resolveArticleId, resolveArticleLink } from '~/lib/react-tweet/utils/article'
import { enrichTweet } from '~/lib/react-tweet/utils/parseTweet'
import { TweetRequests } from '~/lib/rettiwt-api/requests/Tweet'

function urlEntity(href: string): Entity {
  return {
    type: 'url',
    index: 0,
    text: 'x.com/i/article/…',
    display_url: 'x.com/i/article/…',
    url: href,
    expanded_url: href,
    href,
  } as Entity
}

// ─── isArticleUrl / extractArticleIdFromUrl ───────────────────

describe('AC-TWEET-012: article url detection', () => {
  it('AC-TWEET-012: matches i/article and <user>/article links on x.com and twitter.com', () => {
    expect(isArticleUrl('https://x.com/i/article/2104009234858024962')).toBe(true)
    expect(isArticleUrl('https://twitter.com/i/article/2104009234858024962')).toBe(true)
    expect(isArticleUrl('https://x.com/bang_dream_on/article/2104058634452005231')).toBe(true)
    expect(extractArticleIdFromUrl('https://x.com/i/article/2104009234858024962')).toBe('2104009234858024962')
  })

  it('AC-TWEET-012: rejects non-article urls', () => {
    expect(isArticleUrl('https://x.com/i/spaces/1djGXroNWDExZ')).toBe(false)
    expect(isArticleUrl('https://example.com/i/article/1')).toBe(false)
    expect(isArticleUrl(undefined)).toBe(false)
  })

  it('AC-TWEET-012: resolves the article id from entities as a fallback', () => {
    expect(resolveArticleId([{ type: 'text', index: 0 }, urlEntity('https://x.com/i/article/42')])).toBe('42')
    expect(resolveArticleId([])).toBeNull()
  })

  it('AC-TWEET-012: gives a minimal link-only entry when no article node is available', () => {
    // search/list 等路径不取富文本，卡片入口靠实体链接兜底（标题留空，进页面再补）
    expect(resolveArticleLink([urlEntity('https://x.com/i/article/42')])).toEqual({
      id: '42',
      url: 'https://x.com/i/article/42',
      title: '',
      format: 'plain',
    })
    expect(resolveArticleLink([{ type: 'text', index: 0 }])).toBeNull()
  })
})

// ─── mapArticle ──────────────────────────────────────────────

const rawWithArticle = {
  article: {
    article_results: {
      result: {
        rest_id: '2104009234858024962',
        title: '  初のイベント延期のご案内  ',
        preview_text: 'いつもご利用ありがとうございます。',
        plain_text: 'いつもご利用ありがとうございます。\n\n全文です。',
      },
    },
  },
}

describe('AC-TWEET-012: mapArticle', () => {
  it('AC-TWEET-012: maps id/url/title/preview/plain text', () => {
    expect(mapArticle(rawWithArticle as unknown as RawTweet)).toMatchObject({
      id: '2104009234858024962',
      url: 'https://x.com/i/article/2104009234858024962',
      title: '初のイベント延期のご案内',
      previewText: 'いつもご利用ありがとうございます。',
      plainText: 'いつもご利用ありがとうございます。\n\n全文です。',
      format: 'plain',
    })
  })

  it('AC-TWEET-012: returns null without metadata (falls back to the plain link)', () => {
    // 只有实体链接、没有 article 节点 → 不构造空卡片
    expect(mapArticle({} as RawTweet, [urlEntity('https://x.com/i/article/42')])).toBeNull()
    expect(mapArticle(null)).toBeNull()
  })

  it('AC-TWEET-012: drops redundant plainText when a rich block document exists', () => {
    // 有 content_state 时 blocks 已覆盖全文，plain_text 是重复数据（长文可省数十 KB 缓存）
    const rich = {
      article: {
        article_results: {
          result: {
            rest_id: '1',
            title: 'T',
            plain_text: '完整纯文本',
            content_state: { blocks: [{ key: 'b1', text: 'hello', type: 'unstyled' }] },
          },
        },
      },
    }
    const article = mapArticle(rich as unknown as RawTweet)

    expect(article?.format).toBe('rich')
    expect(article?.blocks).toHaveLength(1)
    expect(article?.plainText).toBeUndefined()
  })

  it('AC-TWEET-012: enriches a tweet with the article body', () => {
    const raw = {
      __typename: 'Tweet',
      rest_id: '2104058634452005231',
      core: {
        user_results: {
          result: {
            rest_id: '1990633723885465602',
            is_blue_verified: true,
            profile_image_shape: 'Square',
            avatar: { image_url: 'https://pbs.twimg.com/a_normal.jpg' },
            core: { name: 'バンドリ！アワーノーツ', screen_name: 'bang_dream_on' },
            legacy: { verified: true },
          },
        },
      },
      legacy: {
        lang: 'zxx',
        full_text: 'https://t.co/EhcNsbMwRz',
        created_at: 'Sun Sep 27 04:00:44 +0000 2026',
        entities: {
          hashtags: [],
          user_mentions: [],
          symbols: [],
          urls: [{
            url: 'https://t.co/EhcNsbMwRz',
            expanded_url: 'https://x.com/i/article/2104009234858024962',
            display_url: 'x.com/i/article/2104…',
            indices: [0, 23],
          }],
          media: [],
        },
      },
      ...rawWithArticle,
    } as unknown as RawTweet

    const tweet = enrichTweet(raw)
    expect(tweet?.article).toMatchObject({
      id: '2104009234858024962',
      title: '初のイベント延期のご案内',
      plainText: expect.stringContaining('全文です。'),
    })
  })
})

// ─── request field toggle ────────────────────────────────────

describe('AC-TWEET-013: TweetResultByRestId requests article plain text', () => {
  it('AC-TWEET-013: fieldToggles is a JSON string X understands', () => {
    const config = TweetRequests.details('2104058634452005231')
    const fieldToggles = (config.params as Record<string, unknown>).fieldToggles

    // 对象会被 axios 序列化成 fieldToggles[withArticlePlainText]=true，X 会忽略；
    // 必须与 variables/features 一样是 JSON 字符串。
    expect(typeof fieldToggles).toBe('string')
    expect(JSON.parse(fieldToggles as string)).toEqual({
      withArticleRichContentState: true,
      withArticlePlainText: true,
    })
  })
})
