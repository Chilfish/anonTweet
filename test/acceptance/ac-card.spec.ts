import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  decodeJetfuelPayload,
  parseTrendingCard,
} from '~/lib/rettiwt-api/parsers/jetfuel'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/ac-card.spec.ts
 *
 * AC-CARD-001~005 验收：
 * - AC-CARD-001：请求层 `TweetRequests.details` 已启用 `responsive_web_jetfuel_frame`
 * - AC-CARD-002：真实 jetfuel payload 解码（strings 含 CJK/分类/posts/头像/图）
 * - AC-CARD-003：trending 卡片字段提取完整
 * - AC-CARD-004：解析失败回退 unified_card + `jetfuel.parse.fallback` 日志提示
 * - AC-CARD-005：源码层锁定 Trending 变体分支与关键类名（渲染断言见 card-render.spec.ts，
 *   2026-08-19 评审 P1-1：原「快照驱动」说法为名实不符，改为真实渲染测试版本）
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const FILES = {
  requests: 'app/lib/rettiwt-api/requests/Tweet.ts',
  parseTweet: 'app/lib/react-tweet/utils/parseTweet.ts',
  jetfuel: 'app/lib/rettiwt-api/parsers/jetfuel.ts',
  obsLog: 'app/lib/obs-log.ts',
  card: 'app/components/tweet/TweetCard.tsx',
  trendingCard: 'app/components/tweet/TrendingCard.tsx',
  types: 'app/types/card.ts',
} as const

describe('AC-CARD tweet card jetfuel enhancement', () => {
  it('AC-CARD-001: tweet details request enables jetfuel frame', () => {
    const src = read(FILES.requests)
    // details() 的 features 块内 jetfuel_frame 必须为 true（最小触发 flag）
    expect(src).toMatch(/responsive_web_jetfuel_frame:\s*true/)
    // queryId 保持原样（最小改动原则，未升级到抓包的新 hash）
    expect(src).toContain('aFvUsJm2c-oDkJV75blV6g')
  })

  it('AC-CARD-002: decodes real payload with CJK strings intact', () => {
    const fixture = loadFixture<{ jetfuel_attachment: { payload: string } }>('jetfuel/trending.json')
    const frame = decodeJetfuelPayload(fixture.jetfuel_attachment.payload)

    expect(frame).not.toBeNull()
    const all = frame!.strings.join('\n')
    expect(all).toContain('trending-card')
    expect(all).toContain('Entertainment')
    expect(all).toContain('Celebrity')
    expect(all).toContain('16.5k posts')
    expect(all).toContain('仲町あられの誕生日をファンと盛大に祝う')
    expect(all).toContain('笑顔いっぱいのあられちゃんイラスト')
    expect(all).toMatch(/pbs\.twimg\.com\/media\//)
    expect((all.match(/profile_images\//g) || []).length).toBeGreaterThanOrEqual(3)
  })

  it('AC-CARD-003: parses full trending card fields from real payload', () => {
    const fixture = loadFixture<{ jetfuel_attachment: { payload: string } }>('jetfuel/trending.json')
    const card = parseTrendingCard(fixture.jetfuel_attachment.payload)

    expect(card).not.toBeNull()
    expect(card!.source).toBe('jetfuel')
    expect(card!.url).toBe('https://x.com/i/trending/2088645888549994981')
    expect(card!.imageUrl).toContain('pbs.twimg.com/media/')
    expect(card!.categories).toContain('Entertainment')
    expect(card!.categories).toContain('Celebrity')
    expect(card!.avatars.length).toBeGreaterThanOrEqual(2)
    expect(card!.postsCount).toMatch(/16\.5k posts/)
    expect(card!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(card!.description && card!.description.length).toBeGreaterThan(50)
  })

  it('AC-CARD-004: parser has fallback compensation + developer warning logging', () => {
    // 1) 解析器存在明确的失败语义
    const jetfuelSrc = read(FILES.jetfuel)
    expect(jetfuelSrc).toMatch(/return null/)

    // 2) mapTwitterCard 接入了 jetfuel 合并与回退日志
    const parseSrc = read(FILES.parseTweet)
    expect(parseSrc).toContain('parseTrendingCard(jetfuelAttachment.payload)')
    expect(parseSrc).toContain('jetfuel.parse.fallback')

    // 3) obs-log 注册了该事件
    const obsSrc = read(FILES.obsLog)
    expect(obsSrc).toContain('jetfuel.parse.fallback')

    // 4) 类型层提供 trending 结构化信息
    const typesSrc = read(FILES.types)
    expect(typesSrc).toContain('TrendingCardInfo')
    expect(typesSrc).toContain('trending')
  })

  it('AC-CARD-005: TweetLinkCard renders official-style trending variant', () => {
    const src = read(FILES.card)
    const trendingSrc = read(FILES.trendingCard)
    // Trending 变体组件 + 渲染分支（2026-08-19 P2-1 拆分为 TrendingCard.tsx）
    expect(src).toContain('card?.trending')
    expect(src).toContain('TrendingCardView')
    // 官方结构关键视觉元素（对照 cache/trending.html，现位于 TrendingCard.tsx）
    expect(trendingSrc).toContain('aspect-[18/10]')
    expect(trendingSrc).toContain('line-clamp-3')
    expect(trendingSrc).toContain('line-clamp-2')
    // 头像组：组件渲染的是解析后的 avatars 列表（profile_images 是解析器层关注点）
    expect(trendingSrc).toContain('trending.avatars')
    expect(trendingSrc).toContain('postsCount')
    expect(trendingSrc).toContain('bg-gradient-to-t')
    // 主图为装饰图（alt 空），标题 h3 承载可访问名称（P1-2 a11y）
    expect(trendingSrc).toContain('alt=""')
  })
})
