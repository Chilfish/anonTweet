import type { Message } from '@chilfish/gallery-dl-instagram'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { IGProfileCard } from '~/components/ins/IGProfileCard'
import { IGProfilePostGrid } from '~/components/ins/IGProfilePostGrid'
import { IGProfileSkeleton } from '~/components/ins/IGProfileSkeleton'
import { normalizeIGFeed } from '~/lib/ig/normalizeIGPost'
import { normalizeIGProfile } from '~/lib/ig/normalizeIGProfile'
import { extractIGUsername, igUsernameSourceUrl } from '~/lib/url-detect'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/ac-ig-profile.spec.ts
 *
 * AC-IG-PROFILE-001~004（Instagram 个人主页，2026-11-18）：
 * - 001：`/{username}/info/` 消息流 → `IGProfile`
 * - 002：`/{username}/posts/` feed 按 directory 切段 → 多张 IGPost
 * - 003：主页 URL 识别与源 URL 构造
 * - 004：资料卡 / 帖子网格 / 骨架屏渲染
 *
 * fixture 为按 SDK 类型契约构造的合成消息流，限制见 AC 文档。
 */

function infoMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/user-info.json')
}

function feedMessages(): Message[] {
  return loadFixture<Message[]>('ig-posts/user-feed.json')
}

describe('AC-IG-PROFILE-001: profile info normalization', () => {
  it('AC-IG-PROFILE-001: maps the info directory into an IGProfile', () => {
    const profile = normalizeIGProfile(infoMessages())

    expect(profile).not.toBeNull()
    expect(profile).toEqual({
      username: 'chilfish',
      fullname: 'Chil Fish',
      biography: '匿名浏览测试账号\n第二行简介',
      avatarUrl: 'https://scontent.cdninstagram.com/v/t51.2885-19/avatar-hd.jpg',
      followers: 12345,
      following: 321,
      mediaCount: 456,
      verified: true,
      isPrivate: false,
      externalUrl: 'https://example.com/links',
    })
  })

  it('AC-IG-PROFILE-001: returns null for an empty or directory-less stream', () => {
    expect(normalizeIGProfile([])).toBeNull()
    expect(normalizeIGProfile([
      { type: 'url', url: 'https://scontent.cdninstagram.com/x.jpg', metadata: {} },
    ])).toBeNull()
  })
})

describe('AC-IG-PROFILE-002: user feed fans out per directory', () => {
  it('AC-IG-PROFILE-002: splits two feed posts instead of merging them into one', () => {
    const posts = normalizeIGFeed(feedMessages())

    expect(posts.map(p => p.id)).toEqual(['DdL3LK7Tvj9', 'DdL3LK7Tvj0'])
    expect(posts.map(p => p.type)).toEqual(['post', 'reel'])
    expect(posts.map(p => p.media.length)).toEqual([1, 1])
    expect(posts[0]!.media[0]!.type).toBe('photo')
    expect(posts[1]!.media[0]!.type).toBe('video')
    expect(posts[0]!.created_at).toBe('2026-11-10T08:00:00.000Z')
    expect(posts[1]!.created_at).toBe('2026-11-11T09:30:00.000Z')
  })
})

describe('AC-IG-PROFILE-003: profile URL recognition and source URL building', () => {
  it('AC-IG-PROFILE-003: extracts a username from profile URLs', () => {
    expect(extractIGUsername('https://www.instagram.com/chilfish/')).toBe('chilfish')
    expect(extractIGUsername('https://instagram.com/meeeei.gt?hl=en')).toBe('meeeei.gt')
    expect(extractIGUsername('instagram.com/rin_.t710')).toBe('rin_.t710')
  })

  it('AC-IG-PROFILE-003: rejects posts, reels, stories and reserved paths', () => {
    expect(extractIGUsername('https://www.instagram.com/p/DdL3LK7Tvj9/')).toBeNull()
    expect(extractIGUsername('https://www.instagram.com/reel/DdL3LK7Tvj0/')).toBeNull()
    expect(extractIGUsername('https://www.instagram.com/stories/chilfish/')).toBeNull()
    expect(extractIGUsername('https://www.instagram.com/explore/tags/cat/')).toBeNull()
    expect(extractIGUsername('https://www.instagram.com/accounts/login/')).toBeNull()
    expect(extractIGUsername('chilfish')).toBeNull()
  })

  it('AC-IG-PROFILE-003: builds SDK sub-path source URLs', () => {
    expect(igUsernameSourceUrl('chilfish', 'info'))
      .toBe('https://www.instagram.com/chilfish/info/')
    expect(igUsernameSourceUrl('chilfish', 'posts'))
      .toBe('https://www.instagram.com/chilfish/posts/')
  })
})

describe('AC-IG-PROFILE-004: profile card, post grid and skeleton rendering', () => {
  it('AC-IG-PROFILE-004: renders the profile card with stats and external link', () => {
    const profile = normalizeIGProfile(infoMessages())!
    const html = renderToString(createElement(IGProfileCard, { profile }))

    expect(html).toContain('data-slot="ig-profile-card"')
    expect(html).toContain('data-slot="ig-profile-stats"')
    expect(html).toContain('@chilfish')
    expect(html).toContain('Chil Fish')
    expect(html).toContain('匿名浏览测试账号')
    expect(html).toContain('粉丝')
    expect(html).toContain('href="https://example.com/links"')
    expect(html).not.toContain('aria-label="点赞"')
  })

  it('AC-IG-PROFILE-004: renders one linked cell per feed post', () => {
    const posts = normalizeIGFeed(feedMessages())
    const html = renderToString(
      createElement(MemoryRouter, null, createElement(IGProfilePostGrid, { posts })),
    )

    expect(html).toContain('data-slot="ig-profile-grid"')
    expect(html).toContain('aria-label="查看第 1 条帖子"')
    expect(html).toContain('aria-label="查看第 2 条帖子"')
    expect(html).toContain('href="/ins/DdL3LK7Tvj9"')
    expect(html).toContain('href="/ins/DdL3LK7Tvj0"')
  })

  it('AC-IG-PROFILE-004: skeleton mirrors the profile grid shape', () => {
    const html = renderToString(createElement(IGProfileSkeleton))

    expect(html).toContain('data-slot="ig-profile-skeleton"')
    expect((html.match(/data-slot="ig-profile-skeleton-cell"/g) ?? []).length).toBe(9)
  })
})
