import type { IGPost } from '~/types'
import { generateText } from 'ai'
/**
 * test/acceptance/ac-ig.spec.ts
 *
 * L3 AC 语义层 — Instagram 离线验收：
 * - AC-IG-001/002：fixture 快照结构回归（**辅助检查**——真实 IG 解析在上游 SDK，
 *   离线无解析器可调，故如实标注；跨校验见 AC-IG-001 的 extractIGId 断言）
 * - AC-IG-003/004/005：真实纯函数 `extractIGId` / `formatIGTime`
 * - AC-IG-006：**真实调用 `translateIGCaption`**（F8，review-2026-09-11 P2-1：
 *   原实现只查 fixture 有 captionTranslation + 源码不含 `post.description =`，从未调用该函数）
 * - AC-IG-007/008/009 为集成测试，见 test/integration/api.ig.spec.ts
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { IGMediaGrid } from '~/components/ins/IGMediaGrid'
import { isChinese, translateIGCaption } from '~/lib/translateIGCaption'
import { extractIGId, formatIGTime } from '~/lib/utils'
import { loadFixture } from '../helpers/load-fixture'

// 在 LLM 边界打桩：被测的是 translateIGCaption 的控制流与不可变性，不是模型本身
vi.mock('ai', () => ({
  generateText: vi.fn(async () => ({ text: '这是翻译结果' })),
  Output: {
    text: () => ({}),
  },
}))

type IGPostWithTranslation = IGPost & { captionTranslation?: string }

const ASPECT_RATIO_075 = /aspect-ratio:\s*0?\.75/
const ASPECT_RATIO_ANY = /aspect-ratio:/

describe('AC-IG Instagram offline acceptance', () => {
  it('AC-IG-001: post fixture has complete structure (extractIGId agrees with id)', () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')

    expect(post.id).toBeTruthy()
    expect(post.username).toBeTruthy()
    expect(post.description).toBeDefined()
    expect(post.media?.length).toBeGreaterThan(0)
    expect(['post', 'reel', 'story', 'highlight']).toContain(post.type)
    expect(typeof post.likes).toBe('number')
    // 真实解析器交叉校验：URL → shortcode 与 fixture id 一致
    expect(extractIGId(post.url)).toBe(post.id)
  })

  it('AC-IG-002: media array entries are valid (fixture snapshot, helper check)', () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')
    const problems: string[] = []

    for (const m of post.media || []) {
      if (!m.display_url)
        problems.push(`media[${m.num}] no display_url`)
      if (!['photo', 'video'].includes(m.type))
        problems.push(`media[${m.num}] bad type: ${m.type}`)
      if (m.type === 'video' && !m.video_url)
        problems.push(`media[${m.num}] video missing video_url`)
      if (m.width <= 0 || m.height <= 0)
        problems.push(`media[${m.num}] bad dimensions (${m.width}x${m.height})`)
    }

    expect(problems).toEqual([])
  })

  it('AC-IG-003: stories URL parsing returns the canonical story id', () => {
    expect(extractIGId('https://www.instagram.com/stories/testuser/12345/')).toBe('story~testuser~12345')
  })

  it('AC-IG-004: post URL parsing returns shortcode', () => {
    expect(extractIGId('https://www.instagram.com/p/DWlr-eBgVfR/')).toBe('DWlr-eBgVfR')
  })

  it('AC-IG-005: formatIGTime produces distinct card/plain formats', () => {
    const testDate = '2026-03-28T12:00:00Z'
    const cardFormat = formatIGTime(testDate, 'card')
    const plainFormat = formatIGTime(testDate, 'plain')

    expect(cardFormat).toBeTruthy()
    expect(plainFormat).toBeTruthy()
    expect(cardFormat).not.toBe(plainFormat)
    expect(String(plainFormat)).toContain('2026')
  })

  it('AC-IG-010: single-media grid reserves the media aspect ratio while the image loads', () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')
    const [first] = post.media

    // 1440×1920 → 0.75，占位容器必须在图片就绪前就有确定高度
    const singleHtml = renderToString(
      createElement(IGMediaGrid, {
        media: [first!],
      }),
    )
    expect(singleHtml).toMatch(ASPECT_RATIO_075)
    expect(singleHtml).toContain('data-slot="skeleton"')

    // 多图走 aspect-square 网格，不应套用单图比例
    const gridHtml = renderToString(
      createElement(IGMediaGrid, { media: post.media }),
    )
    expect(gridHtml).not.toMatch(ASPECT_RATIO_ANY)
    expect(gridHtml).toContain('aspect-square')
  })

  it('AC-IG-011: force translation bypasses the Chinese auto-skip for kanji-only Japanese', async () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')
    // 纯汉字日文：汉字比例 100%，旧检测会误判为中文
    const kanjiOnly = { ...post, description: '本日発売' }
    const mockedGenerate = vi.mocked(generateText)
    mockedGenerate.mockClear()

    // 自动路径：被判为中文 → 返回空串，且不发出模型请求
    expect(await translateIGCaption({ post: kanjiOnly, modelInstance: {} as never })).toBe('')
    expect(mockedGenerate).not.toHaveBeenCalled()

    // 手动触发：force 跳过检测，真实调用模型（模拟返回中文译文）
    expect(await translateIGCaption({
      post: kanjiOnly,
      modelInstance: {} as never,
      force: true,
    })).toBe('这是翻译结果')
    expect(mockedGenerate).toHaveBeenCalledTimes(1)

    // 含假名的日文不再被判为中文
    expect(isChinese('東京公演決定です')).toBe(false)
    expect(isChinese('这是中文说明')).toBe(true)
  })

  it('AC-IG-006: translateIGCaption returns a translation without mutating the post', async () => {
    const post = loadFixture<IGPostWithTranslation>('ig-posts/post-with-media.json')
    const original = post.description

    // 非中文 caption → 走真实翻译分支（LLM 已在文件顶部打桩）
    const translated = await translateIGCaption({ post, modelInstance: {} as never })
    expect(translated).toBe('这是翻译结果')
    expect(post.description).toBe(original)

    // 已是中文 → 跳过翻译，返回空串，且不改写原文
    const chinesePost: IGPost = { ...post, description: '这是一段中文说明，无需翻译。' }
    expect(await translateIGCaption({ post: chinesePost, modelInstance: {} as never })).toBe('')
    expect(chinesePost.description).toBe('这是一段中文说明，无需翻译。')

    // 无文本 → 返回空串
    const emptyPost: IGPost = { ...post, description: '' }
    expect(await translateIGCaption({ post: emptyPost, modelInstance: {} as never })).toBe('')
    expect(emptyPost.description).toBe('')
  })
})
