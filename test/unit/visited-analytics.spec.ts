/**
 * test/unit/visited-analytics.spec.ts
 *
 * AC-HOME-004：历史 dashboard 的全量统计、作者聚合、时段分布与全历史热力图。
 */
import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { describe, expect, it } from 'vitest'
import {
  buildVisitedHeatmap,
  buildVisitHours,
  computeVisitedStats,
  groupVisitedByAuthor,
  topVisitedAuthors,
} from '~/lib/visited-analytics'

const now = new Date(2026, 10, 18, 12).getTime()
const at = (month: number, day: number, hour = 12) => new Date(2026, month, day, hour).getTime()

const items: VisitedItem[] = [
  {
    type: 'tweet',
    id: 'a',
    title: 'Chilfish',
    author: 'Chilfish',
    authorHandle: 'Chilfish',
    visits: 3,
    ts: at(10, 18, 10),
  },
  {
    type: 'article',
    id: 'b',
    title: '关于匿名阅读',
    author: 'Chilfish',
    authorHandle: 'Chilfish',
    visits: 1,
    ts: at(10, 17, 12),
  },
  {
    type: 'ig',
    id: 'c',
    title: '@meeeei.gt',
    author: '@meeeei.gt',
    authorHandle: 'meeeei.gt',
    visits: 2,
    ts: at(10, 13, 21),
  },
  {
    type: 'tweet',
    id: 'd',
    title: 'Mika',
    author: 'Mika',
    authorHandle: 'mika_design',
    visits: 1,
    ts: at(10, 5, 8),
  },
]

const events: VisitedEvent[] = [
  {
    ts: at(10, 18, 9),
    type: 'tweet',
    targetId: 'a',
  },
  {
    ts: at(10, 18, 10),
    type: 'tweet',
    targetId: 'a',
  },
  {
    ts: at(10, 17, 12),
    type: 'article',
    targetId: 'b',
  },
  {
    ts: at(10, 13, 20),
    type: 'ig',
    targetId: 'c',
  },
  {
    ts: at(10, 13, 21),
    type: 'ig',
    targetId: 'c',
  },
  {
    ts: at(10, 5, 8),
    type: 'tweet',
    targetId: 'd',
  },
  {
    ts: at(8, 1, 8),
    type: 'tweet',
    targetId: 'old',
  },
]

describe('AC-HOME-004: history analytics', () => {
  it('computes all-history stats, streaks and averages', () => {
    expect(computeVisitedStats(items, events, now)).toMatchObject({
      records: 4,
      visits: 7,
      authors: 3,
      activeDays: 5,
      today: 2,
      currentStreak: 2,
      longestStreak: 2,
      averagePerActiveDay: 1.4,
      byType: { tweet: 2, article: 1, ig: 1 },
    })
  })

  it('falls back to record timestamps when no event log exists', () => {
    expect(computeVisitedStats(items, [], now)).toMatchObject({
      records: 4,
      visits: 4,
      activeDays: 4,
      today: 1,
    })
  })

  it('ranks authors by accumulated visits', () => {
    expect(topVisitedAuthors(items)).toEqual([
      {
        key: '@chilfish',
        label: 'Chilfish',
        records: 2,
        visits: 4,
        lastTs: at(10, 18, 10),
      },
      {
        key: '@meeeei.gt',
        label: '@meeeei.gt',
        records: 1,
        visits: 2,
        lastTs: at(10, 13, 21),
      },
      {
        key: '@mika_design',
        label: 'Mika',
        records: 1,
        visits: 1,
        lastTs: at(10, 5, 8),
      },
    ])
  })

  it('groups records by author and keeps groups sorted by visits', () => {
    const groups = groupVisitedByAuthor(items)

    expect(groups.map(group => group.label)).toEqual([
      'Chilfish',
      '@meeeei.gt',
      'Mika',
    ])
    expect(groups[0]?.items.map(item => item.id)).toEqual(['a', 'b'])
    expect(groups[0]?.visits).toBe(4)
  })

  it('builds a 24-hour distribution', () => {
    const hours = buildVisitHours(events)

    expect(hours).toHaveLength(24)
    expect(hours.reduce((sum, hour) => sum + hour.count, 0)).toBe(7)
    expect(hours[8]?.count).toBe(2)
    expect(hours[9]?.count).toBe(1)
    expect(hours[20]?.count).toBe(1)
    expect(hours[21]?.count).toBe(1)
  })

  it('builds a calendar heatmap ending in the current week', () => {
    const heatmap = buildVisitedHeatmap(items, events, now)

    expect(heatmap.total).toBe(7)
    expect(heatmap.max).toBe(2)
    expect(heatmap.weeks).toHaveLength(12)

    const today = heatmap.weeks.at(-1)?.days[2]
    expect(today).toMatchObject({
      count: 2,
      level: 4,
      isToday: true,
      isFuture: false,
    })

    const futureDays = heatmap.weeks.at(-1)?.days.slice(3) ?? []
    expect(futureDays.every(day => day.isFuture)).toBe(true)
  })
})
