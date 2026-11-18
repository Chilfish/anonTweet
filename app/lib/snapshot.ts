import type { VisitedType } from '~/lib/visited'
import { visitedKey } from '~/lib/visited'

/** 快照保留条数：少于摘要上限，只有最近访问的详情值一份体积 */
export const SNAPSHOT_LIMIT = 100

/**
 * 本地优先：详情页命中快照即直接使用，不再按时间判断是否“新鲜”。
 * `savedAt` 只用于超过 `SNAPSHOT_LIMIT` 时的淘汰顺序，不再承担 TTL。
 */
export function snapshotKey(
  type: VisitedType,
  id: string,
): string {
  return visitedKey({ type, id })
}
