export type VisitedType = 'tweet' | 'ig' | 'article'

export interface VisitedItem {
  type: VisitedType
  /** 路由 id（推文 id / IG shortcode / 文章所属推文 id） */
  id: string
  /** 主文案：作者名、用户名或文章标题 */
  title: string
  /** 次文案：正文 / caption / 摘要，已截断 */
  snippet?: string
  /** 缩略图（头像或首图），缺失时由类型图标兜底 */
  image?: string
  /** 最近一次访问时间（epoch ms） */
  ts: number
  /** 首次访问时间；旧记录缺失时按 ts 处理 */
  firstTs?: number
  /** 累计访问次数；旧记录缺失时按 1 处理 */
  visits?: number
  /** 作者显示名（推文 / 文章作者，IG 为 @username） */
  author?: string
  /** 作者 handle（不含 @），用于稳定分组与筛选 */
  authorHandle?: string
}

/** 一次访问事件（热力图 / 时段统计的数据源，独立于去重后的记录） */
export interface VisitedEvent {
  ts: number
  type: VisitedType
  targetId: string
}

/** IndexedDB 保留的去重记录数 */
export const VISITED_LIMIT = 1000
/** 单次水合进内存的条数（首页只展示 HOME_RECENT_LIMIT 条） */
export const VISITED_MEMORY_LIMIT = 20
/** 首页「最近查看」列表条数（完整记录在 /history） */
export const HOME_RECENT_LIMIT = 3
/** 访问事件保留上限 */
export const VISIT_EVENT_LIMIT = 5000
/** 热力图最多渲染的周数（约 5 年），避免 DOM 无限增长 */
export const HEATMAP_MAX_WEEKS = 260

const HANDLE_PREFIX_RE = /^@/

export function visitedKey(item: Pick<VisitedItem, 'type' | 'id'>): string {
  return `${item.type}:${item.id}`
}

/** 新项置顶；同 type + id 去重并累计访问次数；超出上限截断 */
export function pushVisited(
  list: VisitedItem[],
  item: Omit<VisitedItem, 'ts'> & { ts?: number },
): VisitedItem[] {
  const key = visitedKey(item)
  const existing = list.find(entry => visitedKey(entry) === key)
  const ts = item.ts ?? Date.now()
  const entry: VisitedItem = {
    ...item,
    ts,
    firstTs: existing?.firstTs ?? existing?.ts ?? ts,
    visits: existing
      ? (existing.visits ?? 1) + 1
      : 1,
  }
  return [
    entry,
    ...list.filter(entry => visitedKey(entry) !== key),
  ].slice(0, VISITED_LIMIT)
}

export function visitedHref(item: Pick<VisitedItem, 'type' | 'id'>): string {
  const path = item.type === 'tweet'
    ? 'tweets'
    : item.type === 'ig'
      ? 'ins'
      : 'article'
  return `/${path}/${encodeURIComponent(item.id)}`
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / M月D日 */
export function formatVisitedTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  if (diff < 60_000)
    return '刚刚'
  if (diff < 3_600_000)
    return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000)
    return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 7 * 86_400_000)
    return `${Math.floor(diff / 86_400_000)} 天前`

  const date = new Date(ts)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** 本地日期的 0 点时间戳 */
export function localDayStart(ts: number): number {
  const date = new Date(ts)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** 按本地日历平移天数（跨 DST 也保持 0 点） */
export function shiftLocalDays(ts: number, days: number): number {
  const date = new Date(ts)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

/** 本地日期键 YYYY-MM-DD */
export function localDayKey(ts: number): string {
  const date = new Date(ts)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dayLabel(ts: number, now: number): string {
  const day = localDayStart(ts)
  const today = localDayStart(now)
  if (day === today)
    return '今天'
  if (day === shiftLocalDays(today, -1))
    return '昨天'

  const date = new Date(ts)
  const label = `${date.getMonth() + 1}月${date.getDate()}日`
  return date.getFullYear() === new Date(now).getFullYear()
    ? label
    : `${date.getFullYear()}年${label}`
}

export type VisitedRange = 'all' | 'today' | '7d' | '30d'

/** 时间范围起点（本地 0 点）；`all` 返回 null 表示不限制 */
export function visitedRangeStart(
  range: VisitedRange,
  now = Date.now(),
): number | null {
  const today = localDayStart(now)
  switch (range) {
    case 'today':
      return today
    case '7d':
      return shiftLocalDays(today, -6)
    case '30d':
      return shiftLocalDays(today, -29)
    default:
      return null
  }
}

export type VisitedSort = 'recent' | 'oldest' | 'visits'

export function sortVisited(
  items: VisitedItem[],
  sort: VisitedSort,
): VisitedItem[] {
  const sorted = [...items]
  switch (sort) {
    case 'oldest':
      return sorted.sort((a, b) => a.ts - b.ts)
    case 'visits':
      return sorted.sort(
        (a, b) => (b.visits ?? 1) - (a.visits ?? 1) || b.ts - a.ts,
      )
    default:
      return sorted.sort((a, b) => b.ts - a.ts)
  }
}

export interface VisitedFilter {
  /** 关键词：匹配标题、摘要与作者，忽略大小写 */
  q?: string
  /** 类型筛选，`all` 或缺省表示不过滤 */
  type?: VisitedType | 'all'
  /** 时间范围，`all` 或缺省表示不过滤 */
  range?: VisitedRange
  /** 作者分组键（visitedAuthorKey） */
  author?: string
  /** 计算范围起点用的“现在”，测试可注入 */
  now?: number
}

/** /history 的客户端筛选：类型 + 时间范围 + 作者 + 关键词 */
export function filterVisited(
  items: VisitedItem[],
  { q, type = 'all', range = 'all', author, now = Date.now() }: VisitedFilter = {},
): VisitedItem[] {
  const keyword = q?.trim().toLowerCase() ?? ''
  const since = visitedRangeStart(range, now)
  return items.filter((item) => {
    if (type !== 'all' && item.type !== type)
      return false
    if (since !== null && item.ts < since)
      return false
    if (author && visitedAuthorKey(item) !== author)
      return false
    if (!keyword)
      return true
    return `${item.title} ${item.snippet ?? ''} ${visitedAuthorLabel(item)}`
      .toLowerCase()
      .includes(keyword)
  })
}

/** 作者显示名：优先真实作者，旧记录回退到标题 */
export function visitedAuthorLabel(
  item: Pick<VisitedItem, 'type' | 'title' | 'author' | 'authorHandle'>,
): string {
  if (item.author)
    return item.author
  if (item.authorHandle)
    return `@${item.authorHandle.replace(HANDLE_PREFIX_RE, '')}`
  if (item.type === 'article')
    return 'X 长文'
  return item.title || (item.type === 'ig'
    ? '@Instagram'
    : '推文')
}

/** 作者稳定键：handle 优先，其次显示名；旧文章统一归到 @article */
export function visitedAuthorKey(
  item: Pick<VisitedItem, 'type' | 'title' | 'author' | 'authorHandle'>,
): string {
  if (item.authorHandle)
    return `@${item.authorHandle.replace(HANDLE_PREFIX_RE, '').toLowerCase()}`
  if (item.author)
    return item.author.toLowerCase()
  if (item.type === 'article')
    return '@article'
  return item.title.toLowerCase() || item.type
}

export interface VisitedGroup {
  /** 本地日期 YYYY-MM-DD */
  key: string
  label: string
  items: VisitedItem[]
}

/** 按本地日期分组（今天 / 昨天 / M月D日），空日期不返回，组内保持输入顺序 */
export function groupVisitedByDay(
  items: VisitedItem[],
  now = Date.now(),
): VisitedGroup[] {
  const groups = new Map<string, VisitedGroup>()

  for (const item of items) {
    const key = localDayKey(item.ts)
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        label: dayLabel(item.ts, now),
        items: [],
      }
      groups.set(key, group)
    }
    group.items.push(item)
  }

  return [
    ...groups.values(),
  ]
}

export interface VisitedExport {
  version: 2
  exportedAt: string
  count: number
  items: VisitedItem[]
  events: VisitedEvent[]
}

/** 导出为可读 JSON（纯函数，便于单测与后端复用） */
export function serializeVisitedExport(
  items: VisitedItem[],
  events: VisitedEvent[] = [],
  now = Date.now(),
): string {
  const payload: VisitedExport = {
    version: 2,
    exportedAt: new Date(now).toISOString(),
    count: items.length,
    items,
    events,
  }
  return JSON.stringify(payload, null, 2)
}
