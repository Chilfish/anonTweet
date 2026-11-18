/**
 * test/unit/visited.spec.ts
 *
 * AC-HOME-001：最近查看本地历史纯函数（去重 / 上限 / 相对时间 / 链接构造）。
 */
import type { VisitedItem } from '~/lib/visited'
import { describe, expect, it } from 'vitest'
import {
  formatVisitedTime,
  HOME_RECENT_LIST_LIMIT,
  HOME_VISITED_LIMIT,
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

  it('reserves one slot for continue-reading and three for the list', () => {
    expect(HOME_VISITED_LIMIT).toBe(HOME_RECENT_LIST_LIMIT + 1)
    expect(HOME_VISITED_LIMIT).toBeLessThan(VISITED_LIMIT)
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
