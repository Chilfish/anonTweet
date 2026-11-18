import type { SnapshotRecord } from '~/lib/storage/db'
import type { VisitedType } from '~/lib/visited'
import { visitedKey } from '~/lib/visited'

/** 快照保留条数：少于摘要上限，只有最近访问的详情值一份体积 */
export const SNAPSHOT_LIMIT = 100

/** 超过一天视为过期：重新请求，避免长期展示陈旧的互动数与译文 */
export const SNAPSHOT_TTL = 24 * 60 * 60 * 1000

export function snapshotKey(
  type: VisitedType,
  id: string,
): string {
  return visitedKey({ type, id })
}

export function isSnapshotFresh(
  snapshot: Pick<SnapshotRecord, 'savedAt'>,
  now = Date.now(),
): boolean {
  return now - snapshot.savedAt < SNAPSHOT_TTL
}
