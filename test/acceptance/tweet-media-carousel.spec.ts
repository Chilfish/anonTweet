import type { EnrichedTweet, MediaDetails } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TweetMedia } from '~/lib/react-tweet'
import { loadFixture } from '../helpers/load-fixture'

/**
 * AC-TWEET-022：推文媒体网格的「>4 张」分支。
 *
 * X 单条推文最多 20 张，旧实现只有 2 列网格 + `grid-rows-2`，5 张起每格 16:9 撑高，
 * 20 张会变成十几行的长条。现在 >4 张切横向 scroll-snap 轮播（露边）。
 * 截图复用同一套布局（不改形态、不隐藏元素）。
 */

const baseTweet = loadFixture<EnrichedTweet>('tweets/with-card-ja.json')

const IMG_TAG_RE = /<img/g
const PORTRAIT_ASPECT_RE = /aspect-ratio:\s*0?\.8/

function photo(index: number): MediaDetails {
  return {
    type: 'photo',
    index,
    media_url_https: `https://pbs.twimg.com/media/photo-${index}.jpg`,
    original_info: { width: 1440, height: 1800 },
  }
}

function video(index: number): MediaDetails {
  return {
    type: 'video',
    index,
    media_url_https: `https://pbs.twimg.com/amplify_video_thumb/${index}/img/cover.jpg`,
    original_info: { width: 1440, height: 1800 },
    video_info: {
      aspect_ratio: [4, 5],
      duration: 7000,
      variants: [],
    },
  }
}

function tweetWithMedia(mediaDetails: MediaDetails[]): EnrichedTweet {
  return { ...baseTweet, id: '9000000000000001000', mediaDetails }
}

function renderMedia(
  tweet: EnrichedTweet,
  props: { quoted?: boolean } = {},
): string {
  return renderToString(createElement(TweetMedia, { tweet, ...props }))
}

const countImages = (html: string) => (html.match(IMG_TAG_RE) ?? []).length

describe('AC-TWEET-022: >4 张媒体改横向轮播', () => {
  it('AC-TWEET-022: 20 photos render a scroll-snap carousel with counter', () => {
    const html = renderMedia(tweetWithMedia(Array.from({ length: 20 }, (_, i) => photo(i))))

    expect(html).toContain('snap-x')
    expect(html).toContain('aria-roledescription="carousel"')
    expect(html).toContain('aria-label="媒体，共 20 张"')
    expect(html).toContain('1 / 20')
    expect(html).toContain('第 1 张，共 20 张')
    // 露边轮播：每页 60% 宽（中间一张 + 左右各露 20%，与官方一致）
    expect(html).toContain('basis-[60%]')
    expect(html).toContain('snap-center')
    expect(html).toContain('gap-1')
    expect(html).toMatch(PORTRAIT_ASPECT_RE)
    expect(countImages(html)).toBe(20)
    expect(html).not.toContain('grid-cols-2')
    expect(html).not.toContain('grid-rows-2')
  })

  it('AC-TWEET-022: each page keeps its own aspect ratio with a max height', () => {
    const tall: MediaDetails = {
      type: 'photo',
      index: 1,
      media_url_https: 'https://pbs.twimg.com/media/tall.jpg',
      original_info: { width: 720, height: 2400 },
    }
    const wide: MediaDetails = {
      type: 'photo',
      index: 2,
      media_url_https: 'https://pbs.twimg.com/media/wide.jpg',
      original_info: { width: 2400, height: 1000 },
    }
    const tooTall: MediaDetails = {
      type: 'photo',
      index: 3,
      media_url_https: 'https://pbs.twimg.com/media/tooTall.jpg',
      original_info: { width: 100, height: 5000 },
    }

    const html = renderMedia(tweetWithMedia([
      photo(0),
      tall,
      wide,
      tooTall,
      photo(4),
    ]))

    // 轨道按页顶部对齐，每页自己撑高
    expect(html).toContain('items-start')
    expect(html).toContain('aspect-ratio:0.8')
    expect(html).toContain('aspect-ratio:0.3')
    expect(html).toContain('aspect-ratio:2.4')
    // 高度封顶：页宽 = 比例 × 最大高度，竖向长图变成完整窄条
    expect(html).toContain('max-width:calc(0.3 * min(640px, 80vh))')
    expect(html).toContain('max-width:calc(2.4 * min(640px, 80vh))')
    // 病态细条（1:50）仍夹在 0.1
    expect(html).toContain('aspect-ratio:0.1')
  })

  it('AC-TWEET-022: no layout switch for screenshots (same carousel in plain route)', () => {
    // 截图态与常态同构：plain 路由只是换个容器渲染，不改媒体布局
    const html = renderMedia(tweetWithMedia(Array.from({ length: 8 }, (_, i) => photo(i))))

    expect(html).toContain('snap-x')
    expect(html).toContain('1 / 8')
    expect(countImages(html)).toBe(8)
  })

  it('AC-TWEET-022: 4 photos keep the classic grid (no carousel)', () => {
    const html = renderMedia(tweetWithMedia(Array.from({ length: 4 }, (_, i) => photo(i))))

    expect(html).not.toContain('snap-x')
    expect(html).toContain('grid-cols-2')
    expect(html).not.toContain('aria-label="上一张"')
    expect(countImages(html)).toBe(4)
  })

  it('AC-TWEET-022: single portrait photo keeps max-w and original ratio', () => {
    const html = renderMedia(tweetWithMedia([
      photo(0),
    ]))

    expect(html).toContain('max-w-[85%]')
    expect(html).not.toContain('snap-x')
    expect(countImages(html)).toBe(1)
  })

  it('AC-TWEET-022: mixed video in carousel shows cover + duration, no player', () => {
    const html = renderMedia(tweetWithMedia([
      photo(0),
      photo(1),
      video(2),
      photo(3),
      photo(4),
    ]))

    expect(html).toContain('snap-x')
    expect(html).toContain('0:07')
    expect(html).not.toContain('<video')
    expect(countImages(html)).toBe(5)
  })

  it('AC-TWEET-022: quoted tweet keeps swipe + counter but hides arrows', () => {
    const html = renderMedia(
      tweetWithMedia(Array.from({ length: 6 }, (_, i) => photo(i))),
      { quoted: true },
    )

    expect(html).toContain('snap-x')
    expect(html).toContain('1 / 6')
    expect(html).not.toContain('aria-label="上一张"')
    expect(html).not.toContain('aria-label="下一张"')
  })

  it('AC-TWEET-022: inline media (>4) keeps the vertical stack, not a carousel', () => {
    const html = renderMedia({
      ...tweetWithMedia(Array.from({ length: 6 }, (_, i) => photo(i))),
      isInlineMedia: true,
    })

    expect(html).not.toContain('snap-x')
    expect(html).toContain('flex flex-col gap-0')
    expect(countImages(html)).toBe(6)
  })
})
