/**
 * test/unit/visited.spec.ts
 *
 * AC-HOME-001：最近查看本地历史纯函数（去重 / 上限 / 相对时间 / 链接构造）。
 * AC-HOME-004：历史页筛选、排序、作者标识、按天分组与导出。
 */
import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { describe, expect, it } from 'vitest'
import {
  filterVisited,
  formatVisitedTime,
  groupVisitedByDay,
  HOME_RECENT_LIMIT,
  pushVisited,
  serializeVisitedExport,
  sortVisited,
  VISITED_LIMIT,
  visitedAuthorKey,
  visitedAuthorLabel,
  visitedHref,
  visitedKey,
} from '~/lib/visited'

function item(id: string, type: VisitedItem['type'] = 'tweet'): Omit<VisitedItem, 'ts'> {
  return {
    type,
    id,
    title: `title-${id}`,
  }
}

describe('AC-HOME-001: visited history pure helpers', () => {
  it('pushes the newest entry to the top', () => {
    const list = pushVisited([], {
      ...item('a'),
      ts: 1,
    })
    const next = pushVisited(list, {
      ...item('b'),
      ts: 2,
    })

    expect(next.map(visitedKey)).toEqual(['tweet:b', 'tweet:a'])
  })

  it('dedupes by type + id, refreshes time and accumulates visits', () => {
    const list = pushVisited([], {
      ...item('a'),
      ts: 1,
    })
    const next = pushVisited(list, {
      ...item('a', 'tweet'),
      ts: 5,
    })

    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({
      ts: 5,
      firstTs: 1,
      visits: 2,
    })
  })

  it('keeps the same id under different types', () => {
    const list = pushVisited([], {
      ...item('123', 'tweet'),
      ts: 1,
    })
    const next = pushVisited(list, {
      ...item('123', 'article'),
      ts: 2,
    })

    expect(next).toHaveLength(2)
    expect(next.map(visitedKey)).toEqual(['article:123', 'tweet:123'])
  })

  it('caps the list at VISITED_LIMIT', () => {
    const full = Array.from({ length: VISITED_LIMIT }, (_, i) => ({
      ...item(`id-${i}`),
      ts: i,
    }))
    const next = pushVisited(full, {
      ...item('new'),
      ts: 999,
    })

    expect(next).toHaveLength(VISITED_LIMIT)
    expect(next[0]?.id).toBe('new')
    expect(next.some(i => i.id === `id-${VISITED_LIMIT - 1}`)).toBe(false)
  })

  it('keeps the home list at three entries, smaller than the storage cap', () => {
    expect(HOME_RECENT_LIMIT).toBe(3)
    expect(HOME_RECENT_LIMIT).toBeLessThan(VISITED_LIMIT)
  })

  it('formats relative time buckets', () => {
    const now = 1_700_000_000_000
    expect(formatVisitedTime(now - 10_000, now)).toBe('刚刚')
    expect(formatVisitedTime(now - 5 * 60_000, now)).toBe('5 分钟前')
    expect(formatVisitedTime(now - 3 * 3_600_000, now)).toBe('3 小时前')
    expect(formatVisitedTime(now - 2 * 86_400_000, now)).toBe('2 天前')
    expect(formatVisitedTime(new Date(2026, 0, 9).getTime(), new Date(2026, 0, 20).getTime())).toBe('1月9日')
  })

  it('builds routes per type and encodes the id', () => {
    expect(visitedHref({ type: 'tweet', id: '123' })).toBe('/tweets/123')
    expect(visitedHref({ type: 'article', id: '123' })).toBe('/article/123')
    expect(visitedHref({ type: 'ig', id: 'user/story-1' })).toBe('/ins/user%2Fstory-1')
  })
})

describe('AC-HOME-004: history page filtering, sorting and grouping', () => {
  const now = new Date(2026, 10, 18, 12).getTime()
  const at = (day: number, hour = 12) => new Date(2026, 10, day, hour).getTime()

  const list: VisitedItem[] = [
    {
      type: 'tweet',
      id: 'today',
      title: 'Chilfish',
      snippet: '匿名查看推文与长文',
      author: 'Chilfish',
      authorHandle: 'Chilfish',
      visits: 3,
      ts: at(18),
    },
    {
      type: 'article',
      id: 'yesterday',
      title: '关于匿名阅读',
      snippet: '块文档与按块翻译',
      author: 'Chilfish',
      authorHandle: 'Chilfish',
      visits: 1,
      ts: at(17),
    },
    {
      type: 'ig',
      id: 'week',
      title: '@meeeei.gt',
      author: '@meeeei.gt',
      authorHandle: 'meeeei.gt',
      visits: 9,
      ts: at(13),
    },
    {
      type: 'tweet',
      id: 'month',
      title: 'Mika',
      author: 'Mika',
      authorHandle: 'mika_design',
      visits: 2,
      ts: at(5),
    },
    {
      type: 'tweet',
      id: 'old',
      title: 'old',
      visits: 4,
      ts: new Date(2026, 8, 1, 12).getTime(),
    },
  ]

  it('filters by keyword against title, snippet and author, case-insensitively', () => {
    expect(filterVisited(list, { q: 'chilfish', now }).map(i => i.id)).toEqual([
      'today',
      'yesterday',
    ])
    expect(filterVisited(list, { q: '块文档', now }).map(i => i.id)).toEqual(['yesterday'])
    expect(filterVisited(list, { q: '   ', now })).toHaveLength(5)
    expect(filterVisited(list, { q: 'nope', now })).toEqual([])
  })

  it('filters by type and treats all as no filter', () => {
    expect(filterVisited(list, { type: 'ig', now }).map(i => i.id)).toEqual(['week'])
    expect(filterVisited(list, { type: 'all', now })).toHaveLength(5)
    expect(filterVisited(list, { type: 'article', q: '匿名', now }).map(i => i.id)).toEqual(['yesterday'])
  })

  it('filters by stable author key', () => {
    expect(filterVisited(list, { author: '@chilfish', now }).map(i => i.id)).toEqual([
      'today',
      'yesterday',
    ])
    expect(filterVisited(list, { author: '@mika_design', now }).map(i => i.id)).toEqual(['month'])
  })

  it('filters by local-day time range', () => {
    expect(filterVisited(list, { range: 'today', now }).map(i => i.id)).toEqual(['today'])
    expect(filterVisited(list, { range: '7d', now }).map(i => i.id)).toEqual([
      'today',
      'yesterday',
      'week',
    ])
    expect(filterVisited(list, { range: '30d', now }).map(i => i.id)).toEqual([
      'today',
      'yesterday',
      'week',
      'month',
    ])
    expect(filterVisited(list, { range: 'all', now })).toHaveLength(5)
  })

  it('combines range, type, author and keyword filters', () => {
    expect(filterVisited(list, {
      range: '30d',
      type: 'tweet',
      author: '@mika_design',
      q: 'mika',
      now,
    }).map(i => i.id)).toEqual(['month'])
    expect(filterVisited(list, { range: 'today', type: 'ig', now })).toEqual([])
  })

  it('sorts by recent, oldest and visit count', () => {
    expect(sortVisited(list, 'recent').map(i => i.id)).toEqual([
      'today',
      'yesterday',
      'week',
      'month',
      'old',
    ])
    expect(sortVisited(list, 'oldest').map(i => i.id)).toEqual([
      'old',
      'month',
      'week',
      'yesterday',
      'today',
    ])
    expect(sortVisited(list, 'visits').map(i => i.id)).toEqual([
      'week',
      'old',
      'today',
      'month',
      'yesterday',
    ])
  })

  it('labels and keys authors, falling back for legacy records', () => {
    expect(visitedAuthorLabel(list[0]!)).toBe('Chilfish')
    expect(visitedAuthorKey(list[0]!)).toBe('@chilfish')
    expect(visitedAuthorLabel(list[2]!)).toBe('@meeeei.gt')
    expect(visitedAuthorKey(list[2]!)).toBe('@meeeei.gt')

    const legacyArticle: VisitedItem = {
      type: 'article',
      id: 'x',
      title: '旧文章',
      ts: 0,
    }
    expect(visitedAuthorLabel(legacyArticle)).toBe('X 长文')
    expect(visitedAuthorKey(legacyArticle)).toBe('@article')

    const legacyTweet: VisitedItem = {
      type: 'tweet',
      id: 'y',
      title: 'Alice',
      ts: 0,
    }
    expect(visitedAuthorLabel(legacyTweet)).toBe('Alice')
    expect(visitedAuthorKey(legacyTweet)).toBe('alice')
  })

  it('groups by local day and keeps newest first', () => {
    const grouped = groupVisitedByDay(list, now)

    expect(grouped.map(group => group.label)).toEqual([
      '今天',
      '昨天',
      '11月13日',
      '11月5日',
      '9月1日',
    ])
    expect(grouped.map(group => group.items.map(i => i.id))).toEqual([
      ['today'],
      ['yesterday'],
      ['week'],
      ['month'],
      ['old'],
    ])
  })

  it('drops empty day groups', () => {
    const grouped = groupVisitedByDay([
      {
        type: 'tweet',
        id: 'today',
        title: 't',
        ts: new Date(2026, 10, 18, 9).getTime(),
      },
    ], now)

    expect(grouped.map(group => group.label)).toEqual(['今天'])
  })

  it('serializes an export payload with events', () => {
    const events: VisitedEvent[] = [
      {
        ts: at(18),
        type: 'tweet',
        targetId: 'today',
      },
      {
        ts: at(18),
        type: 'tweet',
        targetId: 'today',
      },
    ]
    const parsed = JSON.parse(serializeVisitedExport(list, events, now)) as {
      version: number
      count: number
      exportedAt: string
      items: VisitedItem[]
      events: VisitedEvent[]
    }

    expect(parsed.version).toBe(2)
    expect(parsed.count).toBe(5)
    expect(parsed.exportedAt).toBe(new Date(now).toISOString())
    expect(parsed.items.map(i => i.id)).toEqual(list.map(i => i.id))
    expect(parsed.events).toHaveLength(2)
  })
})
