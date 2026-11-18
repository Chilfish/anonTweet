import type { VisitedEvent, VisitedItem, VisitedType } from './visited'
import {
  localDayKey,
  localDayStart,
  shiftLocalDays,
  visitedAuthorKey,
  visitedAuthorLabel,
} from './visited'

/** 事件日志为空时（旧数据）回退到每条记录的最近访问时间 */
export function resolveVisitedEvents(
  items: VisitedItem[],
  events: VisitedEvent[],
): VisitedEvent[] {
  if (events.length > 0)
    return events
  return items.map(item => ({
    ts: item.ts,
    type: item.type,
    targetId: item.id,
  }))
}

/** 本地周一 0 点 */
export function localWeekStart(ts: number): number {
  const date = new Date(localDayStart(ts))
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return date.getTime()
}

function computeStreaks(
  dayStarts: number[],
  now: number,
): { current: number, longest: number } {
  if (dayStarts.length === 0)
    return { current: 0, longest: 0 }

  const set = new Set(dayStarts)
  let longest = 0
  let run = 0

  for (let i = 0; i < dayStarts.length; i++) {
    if (i > 0 && dayStarts[i] === shiftLocalDays(dayStarts[i - 1]!, 1))
      run += 1
    else
      run = 1
    longest = Math.max(longest, run)
  }

  const today = localDayStart(now)
  const yesterday = shiftLocalDays(today, -1)
  let cursor: number | null = set.has(today)
    ? today
    : set.has(yesterday)
      ? yesterday
      : null
  let current = 0

  while (cursor !== null && set.has(cursor)) {
    current += 1
    cursor = shiftLocalDays(cursor, -1)
  }

  return { current, longest }
}

export interface VisitedStats {
  /** 去重后的记录数 */
  records: number
  /** 访问事件总数 */
  visits: number
  /** 不同作者数 */
  authors: number
  /** 有访问的不同本地日期数 */
  activeDays: number
  /** 今天访问次数 */
  today: number
  firstTs: number | null
  lastTs: number | null
  currentStreak: number
  longestStreak: number
  averagePerActiveDay: number
  byType: Record<VisitedType, number>
}

/** 全历史总览：记录 / 次数 / 作者 / 活跃天数 / 连续天数 / 类型分布 */
export function computeVisitedStats(
  items: VisitedItem[],
  events: VisitedEvent[],
  now = Date.now(),
): VisitedStats {
  const resolved = resolveVisitedEvents(items, events)
  const daySet = new Set<number>()
  const byType: Record<VisitedType, number> = { tweet: 0, ig: 0, article: 0 }
  const authors = new Set<string>()

  let firstTs: number | null = null
  let lastTs: number | null = null
  let today = 0
  const todayStart = localDayStart(now)

  for (const item of items) {
    byType[item.type] += 1
    authors.add(visitedAuthorKey(item))
  }

  for (const event of resolved) {
    daySet.add(localDayStart(event.ts))
    if (event.ts >= todayStart)
      today += 1
    if (firstTs === null || event.ts < firstTs)
      firstTs = event.ts
    if (lastTs === null || event.ts > lastTs)
      lastTs = event.ts
  }

  const dayStarts = [...daySet].sort((a, b) => a - b)
  const { current, longest } = computeStreaks(dayStarts, now)
  const visits = resolved.length

  return {
    records: items.length,
    visits,
    authors: authors.size,
    activeDays: dayStarts.length,
    today,
    firstTs,
    lastTs,
    currentStreak: current,
    longestStreak: longest,
    averagePerActiveDay: dayStarts.length > 0
      ? visits / dayStarts.length
      : 0,
    byType,
  }
}

export interface VisitedAuthorStat {
  key: string
  label: string
  records: number
  visits: number
  lastTs: number
}

function collectAuthors(items: VisitedItem[]): Map<string, VisitedAuthorStat> {
  const map = new Map<string, VisitedAuthorStat>()

  for (const item of items) {
    const key = visitedAuthorKey(item)
    const existing = map.get(key)
    const visits = item.visits ?? 1

    if (existing) {
      existing.records += 1
      existing.visits += visits
      if (item.ts >= existing.lastTs) {
        existing.lastTs = item.ts
        existing.label = visitedAuthorLabel(item)
      }
      continue
    }

    map.set(key, {
      key,
      label: visitedAuthorLabel(item),
      records: 1,
      visits,
      lastTs: item.ts,
    })
  }

  return map
}

/** 常看作者：按累计浏览次数排序 */
export function topVisitedAuthors(
  items: VisitedItem[],
  limit = 5,
): VisitedAuthorStat[] {
  return [
    ...collectAuthors(items).values(),
  ]
    .sort(
      (a, b) =>
        b.visits - a.visits
        || b.records - a.records
        || b.lastTs - a.lastTs,
    )
    .slice(0, limit)
}

export interface VisitedAuthorGroup extends VisitedAuthorStat {
  items: VisitedItem[]
}

/** 按作者分组：组按累计浏览次数排序，组内保持输入顺序 */
export function groupVisitedByAuthor(items: VisitedItem[]): VisitedAuthorGroup[] {
  const groups = new Map<string, VisitedAuthorGroup>()

  for (const item of items) {
    const key = visitedAuthorKey(item)
    let group = groups.get(key)

    if (!group) {
      group = {
        key,
        label: visitedAuthorLabel(item),
        records: 0,
        visits: 0,
        lastTs: item.ts,
        items: [],
      }
      groups.set(key, group)
    }

    group.records += 1
    group.visits += item.visits ?? 1
    if (item.ts >= group.lastTs) {
      group.lastTs = item.ts
      group.label = visitedAuthorLabel(item)
    }
    group.items.push(item)
  }

  return [
    ...groups.values(),
  ].sort(
    (a, b) => b.visits - a.visits || b.lastTs - a.lastTs,
  )
}

export interface VisitHour {
  hour: number
  count: number
}

/** 24 小时时段分布 */
export function buildVisitHours(events: VisitedEvent[]): VisitHour[] {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))

  for (const event of events) {
    const hour = new Date(event.ts).getHours()
    hours[hour]!.count += 1
  }

  return hours
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapDay {
  key: string
  date: number
  count: number
  level: HeatmapLevel
  isToday: boolean
  isFuture: boolean
  label: string
}

export interface HeatmapWeek {
  key: string
  monthLabel: string
  days: HeatmapDay[]
}

export interface VisitedHeatmap {
  weeks: HeatmapWeek[]
  max: number
  total: number
  firstTs: number | null
  lastTs: number | null
}

function heatLevel(count: number, max: number): HeatmapLevel {
  if (count <= 0)
    return 0
  if (max <= 1)
    return 4
  const ratio = count / max
  if (ratio > 0.75)
    return 4
  if (ratio > 0.5)
    return 3
  if (ratio > 0.25)
    return 2
  return 1
}

/** 全历史日历热力图：周一起始，截止本周；超过 maxWeeks 只保留最近部分 */
export function buildVisitedHeatmap(
  items: VisitedItem[],
  events: VisitedEvent[],
  now = Date.now(),
  maxWeeks = 260,
): VisitedHeatmap {
  const resolved = resolveVisitedEvents(items, events)
  if (resolved.length === 0) {
    return {
      weeks: [],
      max: 0,
      total: 0,
      firstTs: null,
      lastTs: null,
    }
  }

  const counts = new Map<number, number>()
  let firstTs = resolved[0]!.ts
  let lastTs = resolved[0]!.ts

  for (const event of resolved) {
    const day = localDayStart(event.ts)
    counts.set(day, (counts.get(day) ?? 0) + 1)
    if (event.ts < firstTs)
      firstTs = event.ts
    if (event.ts > lastTs)
      lastTs = event.ts
  }

  const max = Math.max(...counts.values())
  const today = localDayStart(now)
  const lastWeek = localWeekStart(now)
  const firstWeek = localWeekStart(firstTs)

  const weekStarts: number[] = []
  for (
    let cursor = firstWeek;
    cursor <= lastWeek;
    cursor = shiftLocalDays(cursor, 7)
  ) {
    weekStarts.push(cursor)
  }

  let previousMonth = -1
  const weeks = weekStarts.slice(-maxWeeks).map((weekStart) => {
    const weekDate = new Date(weekStart)
    const month = weekDate.getMonth()
    const monthLabel = month !== previousMonth
      ? `${month + 1}月`
      : ''
    previousMonth = month

    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = shiftLocalDays(weekStart, offset)
      const count = counts.get(date) ?? 0
      const dayDate = new Date(date)
      return {
        key: localDayKey(date),
        date,
        count,
        level: heatLevel(count, max),
        isToday: date === today,
        isFuture: date > today,
        label: `${dayDate.getMonth() + 1}月${dayDate.getDate()}日 · ${count} 次`,
      }
    })

    return {
      key: localDayKey(weekStart),
      monthLabel,
      days,
    }
  })

  return {
    weeks,
    max,
    total: resolved.length,
    firstTs,
    lastTs,
  }
}
