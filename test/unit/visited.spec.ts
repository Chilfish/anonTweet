/**
 * test/unit/visited.spec.ts
 *
 * AC-HOME-001：最近查看本地历史纯函数（去重 / 上限 / 相对时间 / 链接构造）。
 */
import type { VisitedItem } from '~/lib/visited'
import { describe, expect, it } from 'vitest'
import {
  filterVisited,
  formatVisitedTime,
  groupVisitedByDay,
  HOME_RECENT_LIMIT,
  pushVisited,
  VISITED_LIMIT,
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

  it('dedupes by type + id and refreshes the timestamp', () => {
    const list = pushVisited([], {
      ...item('a'),
      ts: 1,
    })
    const next = pushVisited(list, {
      ...item('a', 'tweet'),
      ts: 5,
    })

    expect(next).toHaveLength(1)
    expect(next[0]?.ts).toBe(5)
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

describe('AC-HOME-004: history page filtering and day grouping', () => {
  const list: VisitedItem[] = [
    {
      type: 'tweet',
      id: 'a',
      title: 'Chilfish',
      snippet: '匿名查看推文与长文',
      ts: 0,
    },
    {
      type: 'article',
      id: 'b',
      title: '关于匿名阅读',
      snippet: '块文档与按块翻译',
      ts: 0,
    },
    {
      type: 'ig',
      id: 'c',
      title: '@meeeei.gt',
      ts: 0,
    },
  ]

  it('filters by keyword against title and snippet, case-insensitively', () => {
    expect(filterVisited(list, { q: 'chilfish' }).map(i => i.id)).toEqual(['a'])
    expect(filterVisited(list, { q: '块文档' }).map(i => i.id)).toEqual(['b'])
    expect(filterVisited(list, { q: '   ' })).toHaveLength(3)
    expect(filterVisited(list, { q: 'nope' })).toEqual([])
  })

  it('filters by type and treats all as no filter', () => {
    expect(filterVisited(list, { type: 'ig' }).map(i => i.id)).toEqual(['c'])
    expect(filterVisited(list, { type: 'all' })).toHaveLength(3)
    expect(filterVisited(list, { type: 'article', q: '匿名' }).map(i => i.id)).toEqual(['b'])
  })

  it('groups by local day and keeps newest first', () => {
    const now = new Date(2026, 10, 18, 12).getTime()
    const grouped = groupVisitedByDay(
      [
        {
          type: 'tweet',
          id: 'today',
          title: 't',
          ts: new Date(2026, 10, 18, 9).getTime(),
        },
        {
          type: 'tweet',
          id: 'yesterday',
          title: 'y',
          ts: new Date(2026, 10, 17, 20).getTime(),
        },
        {
          type: 'ig',
          id: 'earlier',
          title: 'e',
          ts: new Date(2026, 10, 10, 9).getTime(),
        },
      ],
      now,
    )

    expect(grouped.map(group => group.label)).toEqual(['今天', '昨天', '更早'])
    expect(grouped.map(group => group.items.map(i => i.id))).toEqual([
      ['today'],
      ['yesterday'],
      ['earlier'],
    ])
  })

  it('drops empty day groups', () => {
    const now = new Date(2026, 10, 18, 12).getTime()
    const grouped = groupVisitedByDay(
      [
        {
          type: 'tweet',
          id: 'today',
          title: 't',
          ts: new Date(2026, 10, 18, 9).getTime(),
        },
      ],
      now,
    )

    expect(grouped.map(group => group.label)).toEqual(['今天'])
  })
})
