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
/** 首页展示条数 */
export const HOME_VISITED_LIMIT = 5

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
