import type { EnrichedTweet, TrendingCardInfo } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TweetLinkCard } from '~/components/tweet/TweetCard'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/card-render.spec.ts
 *
 * AC-CARD-005~008（评审 P1-1/P1-3，2026-08-19）——TweetLinkCard 真实渲染测试。
 *
 * 背景：AC-CARD-005 v1.0 声称「Storybook / 快照驱动」，实为源码字符串扫描
 * （名实不符）。本文件以 renderToString + HTML 断言替换，给命门组件首份行为锁定：
 * - AC-CARD-005：jetfuel Trending 变体渲染官方结构（照片 + 覆盖层 + 标题/头像/posts/描述）
 * - AC-CARD-006：无 trending 数据回退普通链接卡（不渲染 `aspect-[18/10]` 变体）
 * - AC-CARD-007：trending 存在但主图缺失 → 布局不塌陷（占位盒仍保留 aspect 容器）
 * - AC-CARD-008：完全无卡片数据 → 空渲染（返回空串，不报错）
 * 源码级「变体存在 + 关键类名」锁定保留在 ac-card.spec.ts（AC-CARD-009）。
 */

// 与 ac-card.spec.ts AC-CARD-003 同源的 jetfuel 解析结果（真实 payload 解码值）
const trendingInfo: TrendingCardInfo = {
  source: 'jetfuel',
  url: 'https://x.com/i/trending/2088645888549994981',
  imageUrl: 'https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg?name=orig',
  categories: ['Entertainment', 'Celebrity'],
  avatars: [
    'https://pbs.twimg.com/profile_images/2073745277383819265/hNIVGY1h_normal.jpg',
    'https://pbs.twimg.com/profile_images/2034541349169774592/Y65t9P5F_normal.jpg',
    'https://pbs.twimg.com/profile_images/1722602835299500033/hXskVj9F_normal.png',
  ],
  postsCount: '16.5k posts',
  title: '仲町あられの誕生日をファンと盛大に祝う',
  description: '仮想バンド「夢限大みゅーたいぷ」のボーカル・仲町あられの誕生日を、8月16日にXでファンアートやメッセージが大いに盛り上がっています。あられさんはYouTube登録者数55,555人突破を祝いつつ感謝を伝え、公式アカウントは22時からの生誕記念配信を告知。大切なお知らせもあり、ブルーレイオンラインストアでは描き下ろしイラストのバースデーグッズ受注がスタートしました。身長154cmの元気なあられちゃんを、ファンみんなで祝う一日です。',
}

const baseWithCard = loadFixture<EnrichedTweet>('tweets/with-card-ja.json')

function render(tweet: EnrichedTweet): string {
  return renderToString(createElement(TweetLinkCard, { tweet }))
}

describe('AC-CARD-005: trending card real render (P1-1)', () => {
  const tweet: EnrichedTweet = {
    ...baseWithCard,
    id_str: '2089577916694942006',
    card: { ...baseWithCard.card!, trending: trendingInfo },
  }

  it('AC-CARD-005: renders official trending structure from jetfuel data', () => {
    const html = render(tweet)

    // 官方结构 = aspect 18:10 大图 + 覆盖层（对照 cache/trending.html）
    expect(html).toContain('aspect-[18/10]')
    expect(html).toContain('bg-gradient-to-t')

    // 跳转目标与内容
    expect(html).toContain('href="https://x.com/i/trending/2088645888549994981"')
    expect(html).toContain('仲町あられの誕生日をファンと盛大に祝う')
    expect(html).toContain('16.5k posts')
    expect(html).toContain('Entertainment')

    // 主图 + 3 头像共 ≥4 张图；头像全部装饰性 alt 空（读屏不重复朗读标题）
    const imgs = (html.match(/<img/g) || []).length
    expect(imgs).toBeGreaterThanOrEqual(4)
    const altEmpty = (html.match(/alt=""/g) || []).length
    expect(altEmpty).toBeGreaterThanOrEqual(4)

    // 文本截断只靠 CSS clamp（无 JS 截断残留）
    expect(html).not.toContain('truncateText')
  })
})

describe('AC-CARD-006/007/008: fallback render paths (P1-3)', () => {
  it('AC-CARD-006: without trending data falls back to normal link card', () => {
    // baseWithCard 是 summary 卡（无 trending）→ 普通链接卡布局
    const html = render(baseWithCard)

    expect(html).not.toContain('aspect-[18/10]')
    // 小图缩略布局 + 标题 + 原始跳转
    expect(html).toContain('w-20 h-20')
    expect(html).toContain('渡瀬結月の6げんめっ！=15げんめっ=')
    expect(html).toContain('href="https://t.co/v34aHROs13"')
  })

  it('AC-CARD-007: trending present but image missing keeps layout (no collapse)', () => {
    const tweet: EnrichedTweet = {
      ...baseWithCard,
      card: {
        ...baseWithCard.card!,
        trending: { ...trendingInfo, imageUrl: '' },
      },
    }

    const html = render(tweet)
    // 结构不塌陷：容器仍在、标题与跳转仍在（MediaImage 错误时渲染占位盒）
    expect(html).toContain('aspect-[18/10]')
    expect(html).toContain('仲町あられの誕生日をファンと盛大に祝う')
    expect(html).toContain('href="https://x.com/i/trending/2088645888549994981"')
  })

  it('AC-CARD-008: no card data renders empty string', () => {
    const html = render({ ...baseWithCard, card: undefined })
    expect(html).toBe('')
  })
})
