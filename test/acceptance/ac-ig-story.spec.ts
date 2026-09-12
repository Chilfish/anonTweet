import type { Message } from '@chilfish/gallery-dl-instagram'
import type { IGPost } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IGStoryGrid } from '~/components/ins/IGStoryGrid'
import { IGStoryList } from '~/components/ins/IGStoryList'
import { IGStoryListSkeleton } from '~/components/ins/IGStoryListSkeleton'
import { PlainIGPost } from '~/components/ins/PlainIGPost'
import { normalizeIGPost, normalizeIGPosts } from '~/lib/ig/normalizeIGPost'
import { extractIGStoryDownloadItems } from '~/lib/igDownloader'
import { extractIGId, igIdToSourceUrl, isIGListId, isIGStoryLikeId } from '~/lib/url-detect'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/ac-ig-story.spec.ts
 *
 * AC-IG-STORY-001~007（Instagram Story 接入，2026-09-12）：
 * - 001：合成消息流（SDK 类型契约）→ 真实 `normalizeIGPosts` → 断言单条映射 +
 *        tray 扇出（每 item 一张 post、音频-only 消息被过滤）
 * - 002：`renderToString` 断言 story 卡不套用互动区；tray/精选集渲染为**缩略图网格**
 *        （浏览态点格开查看器），无帖子截图/翻译/更多菜单
 * - 003：服务层缓存/持久化键 —— 单帖写读同键；列表逐 item 以自身 canonical id 落缓存
 * - 004：`extractIGId` / `igIdToSourceUrl` / `isIGListId` 的 URL 识别与往返
 * - 005：下载项提取（文件名 + 视频取 video_url）
 * - 006：网格浏览态/选择态结构 + 快拍骨架屏 + `isIGStoryLikeId` 判定（renderToString）
 * - 007：查看器导航/选择纯逻辑（`test/unit/ig-story-viewer.spec.ts`）
 *
 * 数据来源限制见 `verify/acceptance-criteria/AC-ig-story.md`：fixture 为按 SDK
 * 类型契约构造的合成输入（真实上游结构已用 cookie 实测核对），真实链路仍由集成层
 * AC-IG-008 把关。
 */

const mocks = vi.hoisted(() => ({
  inserts: [] as { postShortcode: string, username: string, jsonContent: IGPost }[],
  cache: new Map<string, unknown>(),
}))

vi.mock('~/lib/localCache', () => ({
  getLocalCache: async ({ id, getter }: { id: string, getter: () => Promise<unknown> }) => {
    const key = `ig-post-${id}`
    if (mocks.cache.has(key))
      return mocks.cache.get(key)
    return await getter()
  },
  setLocalCache: async ({ id, value }: { id: string, value: unknown }) => {
    mocks.cache.set(`ig-post-${id}`, value)
  },
}))

vi.mock('~/lib/database/db.server', () => ({
  isDbAvailable: () => true,
  getDbClient: () => ({
    query: { igPost: { findFirst: async () => null } },
    insert: () => ({
      values: (v: { postShortcode: string, username: string, jsonContent: IGPost }) => {
        mocks.inserts.push(v)
        return { onConflictDoUpdate: async () => {} }
      },
    }),
  }),
}))

const { getCachedIGPost, getIGPostList } = await import('~/lib/service/getIGPost.server')

function storyMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/story-with-link.json')
}

function highlightMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/highlight-with-title.json')
}

function trayMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/tray-multi.json')
}

beforeEach(() => {
  mocks.inserts.length = 0
  mocks.cache.clear()
})

describe('AC-IG-STORY-001: story/highlight/tray extraction from SDK message stream', () => {
  it('AC-IG-STORY-001: maps a single story message stream into one IGPost', () => {
    const posts = normalizeIGPosts(storyMessages())

    expect(posts).toHaveLength(1)
    const post = posts[0]!
    expect(post.type).toBe('story')
    expect(post.description).toBe('')
    expect(post.expires).toBeTruthy()
    expect(post.media[0]?.display_url).toBeTruthy()
    expect(post.storyLink?.url).toBe('https://example.com/live')
    expect(post.storyLink?.title).toBe('Live 配信はこちら')
    expect(post.highlight_title).toBeUndefined()
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

  it('AC-IG-STORY-001: fans a tray reel into one post per item (audio-only file skipped)', () => {
    const posts = normalizeIGPosts(trayMessages())

    // directory + 2 media + 1 audio-only → 2 posts（音频条目不得变成伪 media）
    expect(posts).toHaveLength(2)
    expect(posts.map(p => p.id)).toEqual([
      'story~chilfish~3984520955544140029',
      'story~chilfish~3984520955544149999',
    ])

    for (const post of posts) {
      expect(post.type).toBe('story')
      expect(post.media).toHaveLength(1)
      expect(post.description).toBe('')
      expect(post.expires).toBe('2026-09-13T11:18:53.000Z')
    }

    // 每项取自身 item 的时间与媒体
    expect(posts[0]!.created_at).toBe('2026-09-12T10:02:00.000Z')
    expect(posts[0]!.storyLink?.url).toBe('https://example.com/live')
    expect(posts[1]!.created_at).toBe('2026-09-12T11:18:00.000Z')
    expect(posts[1]!.media[0]?.type).toBe('video')
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

    const normalPost = loadFixture<IGPost>('ig-posts/post-with-media.json')
    const normalHtml = renderToString(createElement(PlainIGPost, { post: normalPost }))
    expect(normalHtml).toContain('aria-label="点赞"')
  })

  it('AC-IG-STORY-002: tray renders as a thumbnail gallery without post actions', () => {
    const posts = normalizeIGPosts(trayMessages())
    const html = renderToString(createElement(IGStoryList, { posts }))

    // 浏览态工具栏：条数 + 选择 + 全部下载（选择态专属的「下载选中」此时不出现）
    expect(html).toContain('条快拍')
    expect(html).toContain('选择')
    expect(html).toContain('全部下载')
    expect(html).not.toContain('下载选中')

    // 网格 2 格：浏览态点击 = 打开查看器
    expect(html).toContain('aria-label="查看第 1 条快拍"')
    expect(html).toContain('aria-label="查看第 2 条快拍"')

    // 查看器关闭时不渲染遮罩内容
    expect(html).not.toContain('关闭查看器')

    // 快拍只保留下载：无帖子互动区 / 截图 / 更多菜单
    expect(html).not.toContain('aria-label="点赞"')
    expect(html).not.toContain('更多选项')
    expect(html).not.toContain('>截图<')
  })
})

describe('AC-IG-STORY-006: story grid, skeleton structure and story-like id detection', () => {
  it('AC-IG-STORY-006: browsing grid renders one labelled cell per item', () => {
    const posts = normalizeIGPosts(trayMessages())
    const html = renderToString(createElement(IGStoryGrid, { posts }))

    expect(html).toContain('aria-label="查看第 1 条快拍"')
    expect(html).toContain('aria-label="查看第 2 条快拍"')
    // 浏览态不带选择语义
    expect(html).not.toContain('选择第')
    expect(html).not.toContain('aria-pressed')

    // 链接贴纸标记（第一条带 storyLink）
    expect(html).toContain('含链接贴纸')
    expect(html).not.toContain('aria-label="点赞"')
  })

  it('AC-IG-STORY-006: selection mode labels cells as selectable and marks the selected one', () => {
    const posts = normalizeIGPosts(trayMessages())
    const html = renderToString(createElement(IGStoryGrid, {
      posts,
      selectable: true,
      selected: new Set([posts[0]!.id]),
    }))

    expect(html).toContain('aria-label="取消选择第 1 条快拍"')
    expect(html).toContain('aria-label="选择第 2 条快拍"')
    expect((html.match(/aria-pressed/g) ?? []).length).toBe(2)
    expect(html).toContain('data-selected="true"')
  })

  it('AC-IG-STORY-006: skeleton mirrors the loaded grid shape', () => {
    const html = renderToString(createElement(IGStoryListSkeleton))

    expect((html.match(/data-slot="story-skeleton-cell"/g) ?? []).length).toBe(12)
    expect(html).toContain('story-skeleton-toolbar')
  })

  it('AC-IG-STORY-006: isIGStoryLikeId separates story routes from post shortcodes', () => {
    expect(isIGStoryLikeId('stories~rin_.t710')).toBe(true)
    expect(isIGStoryLikeId('highlight~18104059936919418')).toBe(true)
    expect(isIGStoryLikeId('story~rin_.t710~3906328154789100102')).toBe(true)

    // 内部缓存键（三段 highlight item）与 post/reel shortcode 都不算快拍族
    expect(isIGStoryLikeId('highlight~18104059936919418~3906328154789100102')).toBe(false)
    expect(isIGStoryLikeId('DWlr-eBgVfR')).toBe(false)
  })
})

describe('AC-IG-STORY-003: DB cache key consistency for story requests', () => {
  it('AC-IG-STORY-003: writes a fetched post under the request key it was read with', async () => {
    const story: IGPost = { ...normalizeIGPost(storyMessages())!, id: 'DQ1a2b3c4dE' }

    const returned = await getCachedIGPost('chilfish/3901234567890123456', async () => story)
    expect(returned).toBe(story)

    await vi.waitFor(() => expect(mocks.inserts).toHaveLength(1))
    expect(mocks.inserts[0]!.postShortcode).toBe('chilfish/3901234567890123456')
  })

  it('AC-IG-STORY-003: keeps the post key when the request key equals the SDK id', async () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')

    await getCachedIGPost(post.id, async () => post)

    await vi.waitFor(() => expect(mocks.inserts).toHaveLength(1))
    expect(mocks.inserts[0]!.postShortcode).toBe(post.id)
  })

  it('AC-IG-STORY-003: list fetch persists each item under its own canonical id', async () => {
    const posts = normalizeIGPosts(trayMessages())

    const returned = await getIGPostList(async () => posts)
    expect(returned).toHaveLength(2)

    await vi.waitFor(() => expect(mocks.inserts).toHaveLength(2))
    expect(mocks.inserts.map(i => i.postShortcode).sort()).toEqual([
      'story~chilfish~3984520955544140029',
      'story~chilfish~3984520955544149999',
    ])
    // 每项独立落入 localCache（per-card 翻译端点可解析）
    expect([...mocks.cache.keys()].sort()).toEqual([
      'ig-post-story~chilfish~3984520955544140029',
      'ig-post-story~chilfish~3984520955544149999',
    ])
  })

  it('AC-IG-STORY-003: list fetch merges an existing item translation from cache', async () => {
    const posts = normalizeIGPosts(trayMessages())
    const first = posts[0]!
    mocks.cache.set(`ig-post-${first.id}`, { ...first, captionTranslation: '已翻译' })

    const returned = await getIGPostList(async () => posts)

    expect(returned[0]!.captionTranslation).toBe('已翻译')
    expect(returned[1]!.captionTranslation).toBeUndefined()
  })
})

describe('AC-IG-STORY-004: story URL recognition and source URL round-trip', () => {
  it('AC-IG-STORY-004: recognizes tray, highlight and single-story URLs as canonical ids', () => {
    expect(extractIGId('https://www.instagram.com/stories/rin_.t710/')).toBe('stories~rin_.t710')
    expect(extractIGId('https://www.instagram.com/stories/highlights/18104059936919418/'))
      .toBe('highlight~18104059936919418')
    expect(extractIGId('https://www.instagram.com/stories/rin_.t710/3906328154789100102/'))
      .toBe('story~rin_.t710~3906328154789100102')

    expect(isIGListId('stories~rin_.t710')).toBe(true)
    expect(isIGListId('highlight~18104059936919418')).toBe(true)
    expect(isIGListId('story~rin_.t710~3906328154789100102')).toBe(false)
  })

  it('AC-IG-STORY-004: round-trips canonical ids back to source URLs', () => {
    expect(igIdToSourceUrl('stories~rin_.t710')).toBe('https://www.instagram.com/stories/rin_.t710/')
    expect(igIdToSourceUrl('highlight~18104059936919418'))
      .toBe('https://www.instagram.com/stories/highlights/18104059936919418/')
    expect(igIdToSourceUrl('story~rin_.t710~3906328154789100102'))
      .toBe('https://www.instagram.com/stories/rin_.t710/3906328154789100102/')
  })

  it('AC-IG-STORY-004: post/reel URLs stay shortcodes and are not list requests', () => {
    expect(extractIGId('https://www.instagram.com/p/DWlr-eBgVfR/')).toBe('DWlr-eBgVfR')
    expect(extractIGId('https://www.instagram.com/reel/CxReel01/')).toBe('CxReel01')
    expect(isIGListId('DWlr-eBgVfR')).toBe(false)
    expect(igIdToSourceUrl('DWlr-eBgVfR')).toBe('https://www.instagram.com/p/DWlr-eBgVfR/')
  })
})

describe('AC-IG-STORY-005: story download item extraction', () => {
  it('AC-IG-STORY-005: builds one filename per story media, videos use video_url', () => {
    const posts = normalizeIGPosts(trayMessages())
    const items = extractIGStoryDownloadItems(posts)

    expect(items).toEqual([
      {
        url: 'https://scontent.cdninstagram.com/v/t51.82787-15/story-1.jpg',
        filename: 'ig-chilfish-story-DdL3LK7Tvj9.jpg',
      },
      {
        url: 'https://scontent.cdninstagram.com/v/t51.82787-15/story-2.mp4',
        filename: 'ig-chilfish-story-DdL3LK7Tvj0.mp4',
      },
    ])
  })

  it('AC-IG-STORY-005: skips media without a downloadable url', () => {
    const posts = normalizeIGPosts(trayMessages())
    const broken: IGPost = {
      ...posts[0]!,
      media: [{ ...posts[0]!.media[0]!, type: 'video', video_url: null }],
    }

    expect(extractIGStoryDownloadItems([broken])).toEqual([])
  })
})
