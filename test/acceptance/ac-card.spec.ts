import fs from 'node:fs'
import path from 'node:path'
import { mapTwitterCard, parseTrendingCard } from '@chilfish/tweet'
import { TweetRequests } from '@chilfish/tweet/internals'
import { describe, expect, it, vi } from 'vitest'
import { loadFixture } from '../helpers/load-fixture'

const TWIMG_MEDIA_RE = /pbs\.twimg\.com\/media\//
const POSTS_COUNT_RE = /16\.5k posts/

/**
 * test/acceptance/ac-card.spec.ts
 *
 * AC-CARD-001~005 验收：
 * - AC-CARD-001：请求层 `TweetRequests.details` 已启用 `responsive_web_jetfuel_frame`
 * - AC-CARD-002：真实 jetfuel payload 解析（CJK 标题/分类/posts/头像/图）
 * - AC-CARD-003：trending 卡片字段提取完整
 * - AC-CARD-004：解析失败回退 unified_card + `jetfuel.parse.fallback` 日志提示
 * - AC-CARD-005~008：真实渲染测试（见 card-render.spec.ts）
 * - AC-CARD-009：源码层锁定 Trending 变体分支与关键类名（辅助检查）
 *
 * 注：解析与请求描述符现在来自 `@chilfish/tweet` / `@chilfish/tweet/internals`，
 * 不再扫描已删除的 `app/lib/rettiwt-api` 副本。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const FILES = {
  obsLog: 'app/lib/obs-log.ts',
  card: 'app/components/tweet/TweetCard.tsx',
  trendingCard: 'app/components/tweet/TrendingCard.tsx',
  types: 'app/types/card.ts',
} as const

describe('AC-CARD tweet card jetfuel enhancement', () => {
  it('AC-CARD-001: tweet details request enables jetfuel frame', () => {
    const request = TweetRequests.details('1')

    // details() 的 features 块内 jetfuel_frame 必须为 true（最小触发 flag）
    expect(JSON.stringify(request.params)).toContain('responsive_web_jetfuel_frame')
    expect(JSON.stringify(request.params)).toContain('true')
    // queryId 保持原样（最小改动原则，未升级到抓包的新 hash）
    expect(request.url).toContain('aFvUsJm2c-oDkJV75blV6g')
  })

  it('AC-CARD-002: parses real payload with CJK fields intact', () => {
    const fixture = loadFixture<{ jetfuel_attachment: { payload: string } }>('jetfuel/trending.json')
    const card = parseTrendingCard(fixture.jetfuel_attachment.payload)

    expect(card).not.toBeNull()
    expect(card!.title).toContain('仲町あられの誕生日をファンと盛大に祝う')
    expect(card!.description).toContain('あられ')
    expect(card!.categories).toContain('Entertainment')
    expect(card!.categories).toContain('Celebrity')
    expect(card!.avatars.length).toBeGreaterThanOrEqual(3)
    expect(card!.imageUrl).toMatch(TWIMG_MEDIA_RE)
    expect(card!.postsCount).toMatch(POSTS_COUNT_RE)
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
    expect(card!.postsCount).toMatch(POSTS_COUNT_RE)
    expect(card!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(card!.description && card!.description.length).toBeGreaterThan(50)
  })

  it('AC-CARD-004: parser has fallback compensation + developer warning logging', () => {
    const fixture = loadFixture<{ jetfuel_attachment: { payload: string }, card: any }>('jetfuel/trending.json')
    const logger = {
      warn: vi.fn(),
    }

    // 损坏 payload：回退 unified_card，并通过注入 logger 发出事件
    const merged = mapTwitterCard(fixture.card, { payload: 'bm90aGluZw==' }, logger)
    expect(merged).not.toBeNull()
    expect(merged!.trending).toBeUndefined()
    expect(logger.warn).toHaveBeenCalledWith('jetfuel.parse.fallback', expect.any(Object))

    // obs-log 注册了该事件
    const obsSrc = read(FILES.obsLog)
    expect(obsSrc).toContain('jetfuel.parse.fallback')

    // 类型层提供 trending 结构化信息
    const typesSrc = read(FILES.types)
    expect(typesSrc).toContain('TrendingCardInfo')
    expect(typesSrc).toContain('LinkPreviewCard')
  })

  it('AC-CARD-009: source-level sanity of trending variant (helper)', () => {
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
