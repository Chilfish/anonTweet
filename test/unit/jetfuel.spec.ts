import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  decodeJetfuelPayload,
  extractJetfuelStrings,
  parseTrendingCard,
} from '~/lib/rettiwt-api/parsers/jetfuel'

const POSTS_COUNT_RE = /16\.5k posts/

/**
 * test/unit/jetfuel.spec.ts
 *
 * P0 覆盖（postmortem #001 解析器先测后写）：jetfuel payload 解码、trending 卡片
 * 字段提取、CJK 字符串提取、损坏/空 payload 回退、mapTwitterCard 合并策略。
 * fixture：test/fixtures/jetfuel/trending.json（真实推文 2089577916694942006）。
 */

function loadFixture() {
  const rel = path.resolve(import.meta.dirname, '../fixtures/jetfuel/trending.json')
  return JSON.parse(readFileSync(rel, 'utf8')) as {
    jetfuel_attachment: { payload: string }
    card: any
  }
}

// ─── decodeJetfuelPayload ───────────────────────────────────

describe('decodeJetfuelPayload', () => {
  it('AC-CARD-002: decodes real payload and keeps CJK strings intact', () => {
    const { jetfuel_attachment } = loadFixture()
    const frame = decodeJetfuelPayload(jetfuel_attachment.payload)

    expect(frame).not.toBeNull()
    expect(frame!.strings.length).toBeGreaterThan(5)

    const all = frame!.strings.join('\n')
    expect(all).toContain('trending-card')
    expect(all).toContain('Entertainment')
    expect(all).toContain('Celebrity')
    expect(all).toContain('16.5k posts')
    // CJK 不被截断（emusks 的 ASCII-only 实现会丢标题）
    expect(all).toContain('仲町あられの誕生日をファンと盛大に祝う')
    expect(all).toContain('笑顔いっぱいのあられちゃんイラスト')
    // 图片与头像 URL
    const mediaMatches = all.match(/pbs\.twimg\.com\/media\//g) || []
    const avatarMatches = all.match(/profile_images\//g) || []
    expect(mediaMatches.length).toBeGreaterThanOrEqual(1)
    expect(avatarMatches.length).toBeGreaterThanOrEqual(3)
  })

  it('returns null for empty / garbage input', () => {
    expect(decodeJetfuelPayload('')).toBeNull()
    expect(decodeJetfuelPayload('!!!not-base64!!!')).toBeNull()
    // "aGVsbG8=" = "hello"（<6 字节，不足 framing 头）应返回 null
    expect(decodeJetfuelPayload('aGVsbG8=')).toBeNull()
    // 长度足够但内容无可提取字符串的合法 base64 → 返回帧对象（strings 为空）
    const frame = decodeJetfuelPayload('aGVsbG8gd29ybGQgdGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRvIHRlc3Q=')
    expect(frame).not.toBeNull()
  })
})

// ─── extractJetfuelStrings ───────────────────────────────────

describe('extractJetfuelStrings', () => {
  it('AC-CARD-002: extracts length-prefixed UTF-8 strings incl. CJK', () => {
    const { jetfuel_attachment } = loadFixture()
    const strings = extractJetfuelStrings(jetfuel_attachment.payload)
    expect(strings.includes('仲町あられの誕生日をファンと盛大に祝う')).toBe(true)
    expect(strings.some(s => s.includes('16.5k posts'))).toBe(true)
  })
})

// ─── parseTrendingCard ───────────────────────────────────────

describe('parseTrendingCard', () => {
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

  it('returns null for damaged payload (fallback trigger)', () => {
    expect(parseTrendingCard('')).toBeNull()
    expect(parseTrendingCard('bm90aGluZw==')).toBeNull() // "nothing"
  })

  it('returns null when critical fields (title/image) are missing', () => {
    // 构造只有随机字符串的假 payload：字符串里没有 media URL 与 CJK 标题
    const bogus = Buffer.from([0x05, ...Buffer.from('hello'), 0x04, ...Buffer.from('world')]).toString('base64')
    expect(parseTrendingCard(bogus)).toBeNull()
  })
})

// ─── mapTwitterCard + jetfuel 合并（回退补偿）──────────────

describe('mapTwitterCard with jetfuel merge', () => {
  const { card, jetfuel_attachment } = loadFixture()

  it('AC-CARD-004: merges jetfuel data over unified_card when payload valid', async () => {
    const { mapTwitterCard } = await import('~/lib/react-tweet/utils/parseTweet')
    const merged = mapTwitterCard(card, jetfuel_attachment)

    expect(merged).not.toBeNull()
    // unified_card 的 topic_detail 标题应为兜底，jetfuel 标题覆盖（同源，值一致）
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(merged!.trending).toBeDefined()
    expect(merged!.trending!.source).toBe('jetfuel')
    // 官方 HTML 用的是 jetfuel 的描述/图（与 unified_card 不同版本）
    expect(merged!.imageUrl).toContain('HPxZhM0aQAAZxz3.jpg')
  })

  it('AC-CARD-004: falls back to unified_card and logs when payload damaged', async () => {
    const { mapTwitterCard } = await import('~/lib/react-tweet/utils/parseTweet')
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const merged = mapTwitterCard(card, { payload: 'bm90aGluZw==' })
    expect(merged).not.toBeNull()
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う') // unified_card 兜底
    expect(merged!.trending).toBeUndefined()

    // 开发者提示日志
    const logCalls = spy.mock.calls.map(c => c.join(' '))
    expect(logCalls.some(l => l.includes('jetfuel.parse.fallback'))).toBe(true)
    spy.mockRestore()
  })

  it('AC-CARD-004: no jetfuel attachment -> silent unified_card result, no fallback log', async () => {
    const { mapTwitterCard } = await import('~/lib/react-tweet/utils/parseTweet')
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const merged = mapTwitterCard(card)
    expect(merged).not.toBeNull()
    expect(merged!.title).toBe('仲町あられの誕生日をファンと盛大に祝う')
    expect(merged!.trending).toBeUndefined()

    const logCalls = spy.mock.calls.map(c => c.join(' '))
    expect(logCalls.some(l => l.includes('jetfuel.parse.fallback'))).toBe(false)
    spy.mockRestore()
  })
})
