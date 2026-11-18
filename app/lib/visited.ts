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
}

/** IndexedDB 保留条数（超出按时间淘汰最旧的记录） */
export const VISITED_LIMIT = 200
/** 单次水合进内存的条数 */
export const VISITED_MEMORY_LIMIT = 20
/** 首页「最近查看」列表条数（完整记录在 /history） */
export const HOME_RECENT_LIMIT = 3

export function visitedKey(item: Pick<VisitedItem, 'type' | 'id'>): string {
  return `${item.type}:${item.id}`
}

/** 新项置顶；同 type + id 去重并刷新时间戳；超出上限截断 */
export function pushVisited(
  list: VisitedItem[],
  item: Omit<VisitedItem, 'ts'> & { ts?: number },
): VisitedItem[] {
  const entry: VisitedItem = { ...item, ts: item.ts ?? Date.now() }
  const key = visitedKey(entry)
  return [
    entry,
    ...list.filter(i => visitedKey(i) !== key),
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

export interface VisitedFilter {
  /** 关键词：匹配标题与摘要，忽略大小写 */
  q?: string
  /** 类型筛选，`all` 或缺省表示不过滤 */
  type?: VisitedType | 'all'
}

/** /history 的客户端筛选：类型 + 关键词，保持原有倒序 */
export function filterVisited(
  items: VisitedItem[],
  { q, type = 'all' }: VisitedFilter = {},
): VisitedItem[] {
  const keyword = q?.trim().toLowerCase() ?? ''
  return items.filter((item) => {
    if (type !== 'all' && item.type !== type)
      return false
    if (!keyword)
      return true
    return `${item.title} ${item.snippet ?? ''}`.toLowerCase().includes(keyword)
  })
}

export interface VisitedGroup {
  label: '今天' | '昨天' | '更早'
  items: VisitedItem[]
}

function startOfDay(date: Date): number {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

/** 按本地日期把历史分成「今天 / 昨天 / 更早」，空分组不返回 */
export function groupVisitedByDay(
  items: VisitedItem[],
  now = Date.now(),
): VisitedGroup[] {
  const today = startOfDay(new Date(now))
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.getTime()

  const buckets: Record<VisitedGroup['label'], VisitedItem[]> = {
    今天: [],
    昨天: [],
    更早: [],
  }

  for (const item of items) {
    const bucket = item.ts >= today
      ? '今天'
      : item.ts >= yesterday
        ? '昨天'
        : '更早'
    buckets[bucket].push(item)
  }

  return (Object.keys(buckets) as VisitedGroup['label'][])
    .filter(label => buckets[label].length > 0)
    .map(label => ({ label, items: buckets[label] }))
}
