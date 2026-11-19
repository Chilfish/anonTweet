import { readFileSync } from 'node:fs'
import path from 'node:path'
import { mapTwitterCard, parseTrendingCard } from '@chilfish/tweet'
import { describe, expect, it, vi } from 'vitest'

const POSTS_COUNT_RE = /16\.5k posts/

/**
 * test/unit/jetfuel.spec.ts
 *
 * P0 覆盖（postmortem #001 解析器先测后写）：trending 卡片字段提取、CJK 字符串、
 * 损坏/空 payload 回退、mapTwitterCard 合并策略。
 * fixture：test/fixtures/jetfuel/trending.json（真实推文 2089577916694942006）。
 *
 * 注：`decodeJetfuelPayload` / `extractJetfuelStrings` 属于包内实现细节，未从
 * `@chilfish/tweet` 导出；这里通过 `parseTrendingCard` 做端到端行为覆盖。
 */

function loadFixture() {
  const rel = path.resolve(import.meta.dirname, '../fixtures/jetfuel/trending.json')
  return JSON.parse(readFileSync(rel, 'utf8')) as {
    jetfuel_attachment: { payload: string }
    card: any
  }
}

describe('parseTrendingCard', () => {
  it('AC-CARD-002: decodes real payload and keeps CJK fields intact', () => {
    const { jetfuel_attachment } = loadFixture()
    const card = parseTrendingCard(jetfuel_attachment.payload)

    expect(card).not.toBeNull()
    // CJK 不被截断（emusks 的 ASCII-only 实现会丢标题）
    expect(card!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(card!.description).toContain('あられ')
    expect(card!.categories).toContain('Entertainment')
    expect(card!.categories).toContain('Celebrity')
    expect(card!.avatars.length).toBeGreaterThanOrEqual(3)
    expect(card!.postsCount).toMatch(POSTS_COUNT_RE)
    expect(card!.imageUrl).toContain('pbs.twimg.com/media/')
  })

  it('returns null for empty / garbage / too-short input', () => {
    expect(parseTrendingCard('')).toBeNull()
    expect(parseTrendingCard('!!!not-base64!!!')).toBeNull()
    // "aGVsbG8=" = "hello"（<6 字节，不足 framing 头）
    expect(parseTrendingCard('aGVsbG8=')).toBeNull()
  })

  it('AC-CARD-003: extracts full trending card fields', () => {
    const { jetfuel_attachment } = loadFixture()
    const card = parseTrendingCard(jetfuel_attachment.payload)

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

  it('returns null when critical fields (title/image) are missing', () => {
    // 构造只有随机字符串的假 payload：字符串里没有 media URL 与 CJK 标题
    const bogus = Buffer.from([
      0x05,
      ...Buffer.from('hello'),
      0x04,
      ...Buffer.from('world'),
    ]).toString('base64')
    expect(parseTrendingCard(bogus)).toBeNull()
  })
})

describe('mapTwitterCard with jetfuel merge', () => {
  const { card, jetfuel_attachment } = loadFixture()

  it('AC-CARD-004: merges jetfuel data over unified_card when payload valid', () => {
    const merged = mapTwitterCard(card, jetfuel_attachment)

    expect(merged).not.toBeNull()
    // unified_card 的 topic_detail 标题应为兜底，jetfuel 标题覆盖（同源，值一致）
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(merged!.trending).toBeDefined()
    expect(merged!.trending!.source).toBe('jetfuel')
    // 官方 HTML 用的是 jetfuel 的描述/图（与 unified_card 不同版本）
    expect(merged!.imageUrl).toContain('HPxZhM0aQAAZxz3.jpg')
  })

  it('AC-CARD-004: falls back to unified_card and logs when payload damaged', () => {
    const logger = {
      warn: vi.fn(),
    }

    const merged = mapTwitterCard(card, { payload: 'bm90aGluZw==' }, logger)
    expect(merged).not.toBeNull()
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う') // unified_card 兜底
    expect(merged!.trending).toBeUndefined()

    expect(logger.warn).toHaveBeenCalledWith('jetfuel.parse.fallback', expect.any(Object))
  })

  it('AC-CARD-004: no jetfuel attachment -> silent unified_card result, no fallback log', () => {
    const logger = {
      warn: vi.fn(),
    }

    const merged = mapTwitterCard(card, undefined, logger)
    expect(merged).not.toBeNull()
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(merged!.trending).toBeUndefined()

    expect(logger.warn).not.toHaveBeenCalled()
  })
})
