import type { EnrichedTweet } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TweetLinkCard } from '~/components/tweet/TweetCard'
import { mapTwitterCard } from '~/lib/react-tweet/utils/parseTweet'
import carouselPayload from '../fixtures/unified-card/carousel.json'
import singleImagePayload from '../fixtures/unified-card/single-image.json'
import videoPayload from '../fixtures/unified-card/video.json'
import { loadFixture } from '../helpers/load-fixture'

/**
 * AC-CARD-011：image_carousel_website 真实渲染（轮播 / 截图强制平铺）。
 * Fixture = 真实广告推文 2118597337345859755 的 unified_card payload。
 *
 * 截图态用 mock 覆盖 `useScreenshoting`：Vitest 下 alias 与相对路径会解析出
 * 两份 store 单例，直接 setState 影响不到组件读取的那份。
 */

const screenState = vi.hoisted(() => ({ screenshoting: false }))

vi.mock('~/lib/stores/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/stores/hooks')>()
  return {
    ...actual,
    useScreenshoting: () => screenState.screenshoting,
  }
})

const baseTweet = loadFixture<EnrichedTweet>('tweets/with-card-ja.json')

const carouselCard = mapTwitterCard({
  name: 'unified_card',
  binding_values: [
    {
      key: 'unified_card',
      value: {
        string_value: JSON.stringify(carouselPayload),
      },
    },
  ],
})!

const singleImageCard = mapTwitterCard({
  name: 'unified_card',
  binding_values: [
    {
      key: 'unified_card',
      value: {
        string_value: JSON.stringify(singleImagePayload),
      },
    },
  ],
})!

const videoCard = mapTwitterCard({
  name: 'unified_card',
  binding_values: [
    {
      key: 'unified_card',
      value: {
        string_value: JSON.stringify(videoPayload),
      },
    },
  ],
})!

const tweet: EnrichedTweet = { ...baseTweet, card: carouselCard }
const singleImageTweet: EnrichedTweet = { ...baseTweet, card: singleImageCard }
const videoTweet: EnrichedTweet = { ...baseTweet, card: videoCard }

const CAROUSEL_URL = 'https://ws-tcg.com/products/bdy_bp/?utm_source=X&amp;utm_medium=cpc&amp;utm_campaign=BDY'

function render(target: EnrichedTweet = tweet): string {
  return renderToString(createElement(TweetLinkCard, { tweet: target }))
}

beforeEach(() => {
  screenState.screenshoting = false
})

describe('AC-CARD-011: carousel card rendering', () => {
  it('AC-CARD-011: renders official-style scroll-snap carousel', () => {
    const html = render()

    // 横向 scroll-snap 轨道 + 5 张图（每张独立 <a>）
    expect(html).toContain('snap-x')
    expect((html.match(/<img/g) || []).length).toBe(5)
    // 首图比例 1440x1800 → 0.8
    expect(html).toMatch(/aspect-ratio:\s*0?\.8/)
    // 官方结构的箭头、计数、CTA 与跳转
    expect(html).toContain('aria-label="上一张"')
    expect(html).toContain('aria-label="下一张"')
    expect(html).toContain('第 1 张，共 5 张')
    expect(html).toContain('了解更多')
    expect(html).toContain(`href="${CAROUSEL_URL}"`)
    expect(html).not.toContain('grid-cols-3')
  })

  it('AC-CARD-011b: screenshot mode forces tiled grid and hides controls', () => {
    screenState.screenshoting = true
    const html = render()

    expect(html).toContain('grid-cols-3')
    expect((html.match(/<img/g) || []).length).toBe(5)
    expect(html).not.toContain('snap-x')
    expect(html).not.toContain('aria-label="上一张"')
    expect(html).not.toContain('切换为轮播')
  })

  it('AC-CARD-011c: toggle button available outside screenshot mode', () => {
    const html = render()
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('切换为平铺')
  })

  it('AC-CARD-011: image_website single card keeps portrait ratio', () => {
    const html = render(singleImageTweet)

    // 1440×1800 竖图按原比例，而不是 unified_card 的 1.91:1 横向裁切
    expect(html).toMatch(/aspect-ratio:\s*0?\.8/)
    expect(html).not.toContain('aspect-[1.91/1]')
    expect(html).not.toContain('snap-x')
    expect(html).not.toContain('图片轮播')
    expect(html).not.toContain('aria-label="上一张"')
    expect((html.match(/<img/g) || []).length).toBe(1)
    expect(html).toContain('了解更多')
    expect(html).toContain(`href="${CAROUSEL_URL}"`)
  })

  it('AC-CARD-011: video_website renders cover + play button + duration (no player)', () => {
    const html = render(videoTweet)

    // 4:5 视频卡：封面 + 播放按钮 + 时长 badge，无 <video>、无 1.91:1 裁切
    expect(html).not.toContain('<video')
    expect((html.match(/<img/g) || []).length).toBe(1)
    expect(html).toContain('src="https://pbs.twimg.com/amplify_video_thumb/2113687393765134336/img/fT6xAMDzjMYY3OvE.jpg"')
    expect(html).toContain('lucide-play')
    expect(html).toContain('0:06')
    expect(html).toContain('aria-label="视频链接：starlink.com"')
    expect(html).toMatch(/aspect-ratio:\s*0?\.8/)
    expect(html).not.toContain('aspect-[1.91/1]')
    expect(html).not.toContain('snap-x')
    expect(html).toContain('今すぐ注文')
    expect(html).toContain('starlink.com')
  })

  it('AC-CARD-011: screenshot mode keeps video cover and overlays', () => {
    screenState.screenshoting = true
    const html = render(videoTweet)

    expect(html).not.toContain('<video')
    expect((html.match(/<img/g) || []).length).toBe(1)
    expect(html).toContain('lucide-play')
    expect(html).toContain('0:06')
    expect(html).toContain('今すぐ注文')
  })
})
