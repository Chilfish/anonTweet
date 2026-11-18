import type { SnapshotRecord } from './db'
import { SNAPSHOT_LIMIT } from '~/lib/snapshot'
import { withDb } from './db'

/**
 * 写入详情快照。
 *
 * 同一 key 覆盖写；超过 `SNAPSHOT_LIMIT` 时按 `savedAt` 淘汰最旧的记录。
 * 与摘要记录共用 `${type}:${id}` 主键，摘要被淘汰 / 删除时由 `storage/visited.ts`
 * 在同一事务里清掉对应快照。
 */
export async function putSnapshot(record: SnapshotRecord): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction('snapshots', 'readwrite')
    const store = tx.objectStore('snapshots')
    await store.put(record)

    let count = await store.count()
    if (count > SNAPSHOT_LIMIT) {
      let cursor = await store.index('savedAt').openCursor()
      while (cursor && count > SNAPSHOT_LIMIT) {
        await cursor.delete()
        count -= 1
        cursor = await cursor.continue()
      }
    }
    await tx.done
  })
}

export async function getSnapshot<T extends SnapshotRecord = SnapshotRecord>(
  key: string,
): Promise<T | null> {
  const snapshot = await withDb(async (db) => {
    const record = await db.get('snapshots', key)
    return (record as T | undefined) ?? null
  })
  return snapshot ?? null
}

export async function deleteSnapshot(key: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete('snapshots', key)
  })
}

export async function clearSnapshots(): Promise<void> {
  await withDb(async (db) => {
    await db.clear('snapshots')
  })
}
