import { describe, expect, it } from 'vitest'
import { mapTwitterCard } from '~/lib/react-tweet/utils/parseTweet'
import carouselPayload from '../fixtures/unified-card/carousel.json'
import singleImagePayload from '../fixtures/unified-card/single-image.json'
import videoPayload from '../fixtures/unified-card/video.json'

/**
 * Unified Card `image_carousel_website` 解析（广告多图卡）。
 * Fixture 来自真实推文 2118597337345859755 的 unified_card payload 裁剪。
 */

function unifiedCard(payload: unknown) {
  return {
    name: 'unified_card',
    binding_values: [
      {
        key: 'unified_card',
        value: {
          string_value: JSON.stringify(payload),
        },
      },
    ],
  }
}

describe('AC-CARD-010: image_carousel_website parsing', () => {
  const card = mapTwitterCard(unifiedCard(carouselPayload))!

  it('preserves media_list order instead of media_entities key order', () => {
    expect(card.layout).toBe('image_carousel')
    expect(card.images?.map(image => image.url)).toEqual([
      'https://pbs.twimg.com/media/HWbE2ioboAAwFUp.jpg',
      'https://pbs.twimg.com/media/HWbE5YVaMAAGH3d.jpg',
      'https://pbs.twimg.com/media/HWbE7Tia4AA2SlD.jpg',
      'https://pbs.twimg.com/media/HWbE8vbbQAAFcaN.jpg',
      'https://pbs.twimg.com/media/HWbE-LhagAAuxy3.jpg',
    ])
    // 封面固定为轮播首图（旧逻辑会取到对象首键的第 2 张）
    expect(card.imageUrl).toBe(card.images![0]!.url)
  })

  it('extracts dimensions, dominant color and per-image destination', () => {
    expect(card.images).toHaveLength(5)
    expect(card.images![0]).toMatchObject({
      width: 1440,
      height: 1800,
      color: '#ffeb9d',
      href: 'https://ws-tcg.com/products/bdy_bp/?utm_source=X&utm_medium=cpc&utm_campaign=BDY',
    })
  })

  it('treats zero-width-space title as empty and localizes CTA', () => {
    expect(card.title).toBeUndefined()
    expect(card.domain).toBe('ws-tcg.com')
    expect(card.ctaLabel).toBe('了解更多')
    expect(card.mediaFirst).toBe(true)
  })

  it('skips media_list ids missing from media_entities', () => {
    const payload = {
      type: 'image_carousel_website',
      component_objects: {
        swipeable_media_1: {
          type: 'swipeable_media',
          data: {
            media_list: [
              { id: '3_a', destination: 'browser_1' },
              { id: '3_missing', destination: 'browser_1' },
            ],
          },
        },
      },
      destination_objects: {
        browser_1: {
          type: 'browser',
          data: {
            url_data: { url: 'https://example.com', vanity: 'example.com' },
          },
        },
      },
      media_entities: {
        '3_a': {
          media_url_https: 'https://pbs.twimg.com/media/a.jpg',
          original_info: { width: 900, height: 1200 },
        },
      },
    }
    const parsed = mapTwitterCard(unifiedCard(payload))!
    expect(parsed.images).toHaveLength(1)
    expect(parsed.imageUrl).toBe('https://pbs.twimg.com/media/a.jpg')
    expect(parsed.layout).toBe('image_carousel')
  })

  it('marks mediaFirst=false when details component is declared first', () => {
    const payload = {
      type: 'image_carousel_website',
      component_objects: {
        details_1: {
          type: 'details',
          data: {
            subtitle: { content: 'example.com' },
          },
        },
        swipeable_media_1: {
          type: 'swipeable_media',
          data: {
            media_list: [
              { id: 'm1', destination: 'browser_1' },
              { id: 'm2', destination: 'browser_1' },
            ],
          },
        },
      },
      components: ['details_1', 'swipeable_media_1'],
      destination_objects: {
        browser_1: {
          type: 'browser',
          data: {
            url_data: { url: 'https://example.com', vanity: 'example.com' },
          },
        },
      },
      media_entities: {
        m1: {
          media_url_https: 'https://pbs.twimg.com/media/1.jpg',
          original_info: { width: 800, height: 1000 },
        },
        m2: {
          media_url_https: 'https://pbs.twimg.com/media/2.jpg',
          original_info: { width: 800, height: 1000 },
        },
      },
    }
    expect(mapTwitterCard(unifiedCard(payload))!.mediaFirst).toBe(false)
  })

  it('keeps legacy unified cards on the default layout', () => {
    const payload = {
      component_objects: {
        details_1: {
          data: {
            title: { content: 'YT Video' },
            subtitle: { content: 'youtube.com' },
          },
        },
      },
      destination_objects: {
        browser_1: {
          data: {
            url_data: { url: 'https://youtu.be/abc', vanity: 'youtube.com' },
          },
        },
      },
      media_entities: {
        m1: { media_url_https: 'https://img.youtube.com/vi/abc/hqdefault.jpg' },
      },
    }
    const parsed = mapTwitterCard(unifiedCard(payload))!
    expect(parsed.layout).toBe('default')
    expect(parsed.images).toBeUndefined()
  })

  it('AC-CARD-010: parses image_website single media as image_card with natural ratio', () => {
    const parsed = mapTwitterCard(unifiedCard(singleImagePayload))!
    expect(parsed.layout).toBe('image_card')
    expect(parsed.images).toHaveLength(1)
    expect(parsed.images![0]).toMatchObject({
      url: 'https://pbs.twimg.com/media/HWbFMdybkAAqTfE.jpg',
      width: 1440,
      height: 1800,
      color: '#f8dce8',
      href: 'https://ws-tcg.com/products/bdy_bp/?utm_source=X&utm_medium=cpc&utm_campaign=BDY',
    })
    expect(parsed.imageUrl).toBe(parsed.images![0]!.url)
    expect(parsed.ctaLabel).toBe('了解更多')
    expect(parsed.mediaFirst).toBe(true)
  })

  it('AC-CARD-010: parses video_website as video_card with cover + duration', () => {
    const parsed = mapTwitterCard(unifiedCard(videoPayload))!
    expect(parsed.layout).toBe('video_card')
    expect(parsed.title).toBe('今すぐ注文')
    expect(parsed.domain).toBe('starlink.com')
    expect(parsed.images).toHaveLength(1)
    expect(parsed.images![0]).toMatchObject({
      type: 'video',
      url: 'https://pbs.twimg.com/amplify_video_thumb/2113687393765134336/img/fT6xAMDzjMYY3OvE.jpg',
      width: 1440,
      height: 1800,
      color: '#212735',
      video: {
        mp4: 'https://video.twimg.com/amplify_video/2113687393765134336/vid/avc1/720x900/aP59fMRNAqccTzts.mp4?tag=14',
        hls: 'https://video.twimg.com/amplify_video/2113687393765134336/pl/XyEoRL2dA2Ttossx.m3u8?tag=14',
        durationMs: 6006,
      },
    })
  })
})
