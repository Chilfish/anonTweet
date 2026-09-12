import type { Message } from '@chilfish/gallery-dl-instagram'
import type { IGPost } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PlainIGPost } from '~/components/ins/PlainIGPost'
import { normalizeIGPost } from '~/lib/ig/normalizeIGPost'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/ac-ig-story.spec.ts
 *
 * AC-IG-STORY-001~003（Instagram Story 接入，2026-09-12）：
 * - 001：合成消息流（SDK 类型契约）→ 真实 `normalizeIGPost` → 断言 story 字段映射
 * - 002：`renderToString` 断言 story 卡不套用帖子互动区 + 渲染链接贴纸/精选标题，
 *        并以普通 post 作反证（证明分支非恒真/恒假）
 * - 003：服务层缓存键一致性 —— story 的请求键（username/story_id）与 SDK `id` 不同，
 *        DB 写入必须用请求键（打桩 localCache + db 边界）
 *
 * 数据来源限制见 `verify/acceptance-criteria/AC-ig-story.md`：fixture 为按 SDK
 * 类型契约构造的合成输入（沙箱无 INS_COOKIES 无法录制真实 payload），真实上游链路
 * 由集成层 AC-IG-008 把关。
 */

const dbCapture = vi.hoisted(() => {
  const inserted: { postShortcode: string, username: string, jsonContent: IGPost }[] = []
  return { inserted }
})

vi.mock('~/lib/localCache', () => ({
  getLocalCache: async ({ getter }: { getter: () => Promise<unknown> }) => await getter(),
  setLocalCache: async () => {},
}))

vi.mock('~/lib/database/db.server', () => ({
  isDbAvailable: () => true,
  getDbClient: () => ({
    query: { igPost: { findFirst: async () => null } },
    insert: () => ({
      values: (v: { postShortcode: string, username: string, jsonContent: IGPost }) => {
        dbCapture.inserted.push(v)
        return { onConflictDoUpdate: async () => {} }
      },
    }),
  }),
}))

const { getCachedIGPost } = await import('~/lib/service/getIGPost.server')

function storyMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/story-with-link.json')
}

function highlightMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/highlight-with-title.json')
}

describe('AC-IG-STORY-001: story/highlight extraction from SDK message stream', () => {
  it('AC-IG-STORY-001: maps a story message stream into an IGPost with story fields', () => {
    const post = normalizeIGPost(storyMessages())

    expect(post).not.toBeNull()
    expect(post!.type).toBe('story')
    expect(post!.media).toHaveLength(1)
    expect(post!.media[0]?.display_url).toBeTruthy()
    expect(post!.description).toBe('')
    expect(post!.expires).toBeTruthy()
    expect(post!.storyLink?.url).toBe('https://example.com/live')
    expect(post!.storyLink?.title).toBe('Live 配信はこちら')
    expect(post!.highlight_title).toBeUndefined()
  })

  it('AC-IG-STORY-001: maps a highlight stream with its title and video media', () => {
    const post = normalizeIGPost(highlightMessages())

    expect(post).not.toBeNull()
    expect(post!.type).toBe('highlight')
    expect(post!.highlight_title).toBe('佐世保遠征')
    expect(post!.media[0]?.type).toBe('video')
    expect(post!.media[0]?.video_url).toBeTruthy()
    expect(post!.storyLink).toBeUndefined()
  })
})

describe('AC-IG-STORY-002: story-aware rendering', () => {
  it('AC-IG-STORY-002: story card renders the link sticker and omits the post action bar', () => {
    const post = normalizeIGPost(storyMessages())!
    const html = renderToString(createElement(PlainIGPost, { post }))

    expect(html).not.toContain('aria-label="点赞"')
    expect(html).toContain('href="https://example.com/live"')
    expect(html).toContain('Live 配信はこちら')
  })

  it('AC-IG-STORY-002: highlight renders its title; a normal post still renders the action bar', () => {
    const highlight = normalizeIGPost(highlightMessages())!
    const highlightHtml = renderToString(createElement(PlainIGPost, { post: highlight }))

    expect(highlightHtml).toContain('佐世保遠征')
    expect(highlightHtml).not.toContain('aria-label="点赞"')

    // 反证：普通 post 仍渲染互动栏 —— 分支非恒假
    const normalPost = loadFixture<IGPost>('ig-posts/post-with-media.json')
    const normalHtml = renderToString(createElement(PlainIGPost, { post: normalPost }))
    expect(normalHtml).toContain('aria-label="点赞"')
  })
})

describe('AC-IG-STORY-003: DB cache key consistency for story requests', () => {
  it('AC-IG-STORY-003: writes the DB cache under the request key, not the SDK id', async () => {
    dbCapture.inserted.length = 0
    // SDK shortcode 与请求键不同 —— 修复前写 post.id 会导致读取侧永久未命中
    const story: IGPost = { ...normalizeIGPost(storyMessages())!, id: 'DQ1a2b3c4dE' }

    const returned = await getCachedIGPost('chilfish/3901234567890123456', async () => story)
    expect(returned).toBe(story)

    await vi.waitFor(() => expect(dbCapture.inserted).toHaveLength(1))
    expect(dbCapture.inserted[0]!.postShortcode).toBe('chilfish/3901234567890123456')
  })

  it('AC-IG-STORY-003: keeps the post key when the request key equals the SDK id', async () => {
    dbCapture.inserted.length = 0
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')

    await getCachedIGPost(post.id, async () => post)

    await vi.waitFor(() => expect(dbCapture.inserted).toHaveLength(1))
    expect(dbCapture.inserted[0]!.postShortcode).toBe(post.id)
  })
})
