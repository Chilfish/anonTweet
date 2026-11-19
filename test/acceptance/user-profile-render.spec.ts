/**
 * test/acceptance/user-profile-render.spec.ts
 *
 * AC-USER-001：资料卡内容；AC-USER-002：路由、状态与布局。
 */
import type { RawUser } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProfileCard } from '~/components/profile/ProfileCard'
import { readProjectFile } from '../helpers/read-project-file'

const user: RawUser = {
  id: '1',
  userName: 'anon_tweet',
  fullName: 'Anon Tweet',
  createdAt: '2019-03-15T00:00:00.000Z',
  description: '匿名浏览推文\n第二行 #测试 @someone',
  followersCount: 1234,
  followingsCount: 56,
  statusesCount: 789,
  likeCount: 12,
  pinnedTweets: [],
  isVerified: true,
  location: 'Tokyo',
  profileImage: 'https://pbs.twimg.com/profile_images/1722602835299500033/hXskVj9F_normal.png',
  profileBanner: 'https://example.com/banner.jpg',
}

describe('AC-USER-001: profile card', () => {
  it('renders identity, bio, metadata and stats', () => {
    const html = renderToString(createElement(ProfileCard, { user }))

    expect(html).toContain('Anon Tweet')
    expect(html).toContain('anon_tweet')
    expect(html).toContain('匿名浏览推文')
    expect(html).toContain('第二行')
    expect(html).toContain('/user/someone')
    expect(html).toContain('/search?q=%23')
    expect(html).not.toContain('_normal.png')
    expect(html).toContain('Tokyo')
    expect(html).toContain('2019 年 3 月加入')
    expect(html).toContain('1,234')
    expect(html).toContain('正在关注')
    expect(html).toContain('关注者')
    expect(html).toContain('帖子')
    expect(html).toContain('在 X 查看')
    expect(html).toContain('aria-label="已认证账号"')
  })
})

describe('AC-USER-002: profile route', () => {
  it('is registered and keeps mobile spacing with solid surfaces', () => {
    const routes = readProjectFile('app/routes.ts')
    expect(routes, 'app/routes.ts should exist').not.toBeNull()
    expect(routes).toContain('routes/user.tsx')

    const page = readProjectFile('app/routes/user.tsx')
    expect(page, 'app/routes/user.tsx should exist').not.toBeNull()
    expect(page).toContain('max-w-[600px]')
    expect(page).toContain('px-3 sm:px-0')
    expect(page).toContain('bg-card')
    expect(page).toContain('noindex: true')
    expect(page).toContain('未开启用户时间线')
    expect(page).toContain('转推自 @')
    expect(page).toContain('加载更多')
    expect(page).toContain('含回复与转推')
    expect(page).toContain('USERNAME_RE')
  })
})
