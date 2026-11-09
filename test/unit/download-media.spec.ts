import type { EnrichedTweet, LinkPreviewCard } from '~/types'
import { describe, expect, it } from 'vitest'
import { extractDownloadItemsFromTweets } from '~/components/translation/DownloadMedia'

/**
 * AC-CARD-012：媒体卡批量下载提取。
 * 回归：多图轮播此前只下载 `card.imageUrl`（第一张），其余图片被丢弃。
 */

function makeTweet(card: LinkPreviewCard): EnrichedTweet {
  return {
    id_str: '2118597337345859755',
    created_at: '2026-11-06T06:52:21.000Z',
    user: { screen_name: 'wstcg' },
    entities: [],
    card,
  } as unknown as EnrichedTweet
}

const carouselCard: LinkPreviewCard = {
  type: 'unified_card',
  layout: 'image_carousel',
  url: 'https://ws-tcg.com/products/bdy_bp/',
  title: '',
  description: '',
  domain: 'ws-tcg.com',
  imageUrl: 'https://pbs.twimg.com/media/a.jpg',
  images: [
    { url: 'https://pbs.twimg.com/media/a.jpg', width: 1440, height: 1800 },
    { url: 'https://pbs.twimg.com/media/b.jpg', width: 1440, height: 1800 },
    { url: 'https://pbs.twimg.com/media/c.jpg', width: 1440, height: 1800 },
  ],
}

describe('AC-CARD-012: card media download extraction', () => {
  it('AC-CARD-012: downloads every carousel image instead of only the cover', () => {
    const items = extractDownloadItemsFromTweets([
      makeTweet(carouselCard),
    ], 'large', true)

    expect(items.map(item => item.url)).toEqual([
      'https://pbs.twimg.com/media/a.jpg?format=jpg&name=large',
      'https://pbs.twimg.com/media/b.jpg?format=jpg&name=large',
      'https://pbs.twimg.com/media/c.jpg?format=jpg&name=large',
    ])
    // 文件名唯一（首图无后缀，后续 -1 / -2）
    expect(new Set(items.map(item => item.filename)).size).toBe(3)
    expect(items.every(item => item.filename.endsWith('.jpg'))).toBe(true)
  })

  it('AC-CARD-012: card video downloads proxied mp4', () => {
    const videoCard: LinkPreviewCard = {
      ...carouselCard,
      layout: 'video_card',
      images: [
        {
          url: 'https://pbs.twimg.com/amplify_video_thumb/x.jpg',
          width: 1440,
          height: 1800,
          type: 'video',
          video: { mp4: 'https://video.twimg.com/amplify_video/v.mp4' },
        },
      ],
    }

    const items = extractDownloadItemsFromTweets([
      makeTweet(videoCard),
    ], 'large', true)

    expect(items).toHaveLength(1)
    expect(items[0]!.url).toBe('https://proxy.chilfish.top/https://video.twimg.com/amplify_video/v.mp4')
    expect(items[0]!.filename.endsWith('.mp4')).toBe(true)
  })

  it('AC-CARD-012: falls back to the cover when video has no mp4 source', () => {
    const videoCard: LinkPreviewCard = {
      ...carouselCard,
      layout: 'video_card',
      images: [
        {
          url: 'https://pbs.twimg.com/amplify_video_thumb/y.jpg',
          width: 1440,
          height: 1800,
          type: 'video',
          video: { durationMs: 6006 },
        },
      ],
    }

    const items = extractDownloadItemsFromTweets([
      makeTweet(videoCard),
    ], 'large', true)
    expect(items[0]!.url).toBe('https://pbs.twimg.com/amplify_video_thumb/y.jpg?format=jpg&name=large')
    expect(items[0]!.filename.endsWith('.jpg')).toBe(true)
  })

  it('AC-CARD-012: skips card media when the option is off', () => {
    const items = extractDownloadItemsFromTweets([
      makeTweet(carouselCard),
    ], 'large', false)
    expect(items).toHaveLength(0)
  })
})
