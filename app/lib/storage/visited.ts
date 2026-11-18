import type { StoredVisited } from './db'
import type { VisitedItem } from '~/lib/visited'
import { visitedKey } from '~/lib/visited'
import { withDb } from './db'

/** 持久化保留条数（超出按时间淘汰最旧的记录） */
export const VISITED_STORAGE_LIMIT = 200
/** 一次水合进内存的条数（首页只展示 HOME_RECENT_LIMIT 条） */
export const VISITED_HYDRATE_LIMIT = 20

const LEGACY_STORAGE_KEY = 'visited-store'

function toRecord(item: VisitedItem): StoredVisited {
  return {
    ...item,
    key: visitedKey(item),
  }
}

export async function recordVisited(
  item: Omit<VisitedItem, 'ts'> & { ts?: number },
): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction([
      'visited',
      'snapshots',
    ], 'readwrite')
    const store = tx.objectStore('visited')
    const snapshots = tx.objectStore('snapshots')
    await store.put(toRecord({ ...item, ts: item.ts ?? Date.now() }))

    let count = await store.count()
    if (count > VISITED_STORAGE_LIMIT) {
      let cursor = await store.index('ts').openCursor()
      while (cursor && count > VISITED_STORAGE_LIMIT) {
        // 摘要淘汰时同事务删掉详情快照，避免留下孤儿数据
        await snapshots.delete(cursor.value.key)
        await cursor.delete()
        count -= 1
        cursor = await cursor.continue()
      }
    }
    await tx.done
  })
}

/** 读取完整浏览历史（默认取满持久化上限，供 /history 使用） */
export async function loadVisitedHistory(
  limit = VISITED_STORAGE_LIMIT,
): Promise<VisitedItem[]> {
  const items = await withDb(async (db) => {
    const tx = db.transaction('visited', 'readonly')
    const index = tx.objectStore('visited').index('ts')
    const result: VisitedItem[] = []

    let cursor = await index.openCursor(null, 'prev')
    while (cursor && result.length < limit) {
      const stored = cursor.value
      result.push({
        type: stored.type,
        id: stored.id,
        title: stored.title,
        snippet: stored.snippet,
        image: stored.image,
        ts: stored.ts,
      })
      cursor = await cursor.continue()
    }
    await tx.done
    return result
  })

  return items ?? []
}

export async function loadRecentVisited(
  limit = VISITED_HYDRATE_LIMIT,
): Promise<VisitedItem[]> {
  return loadVisitedHistory(limit)
}

export async function removeVisitedRecord(key: string): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction([
      'visited',
      'snapshots',
    ], 'readwrite')
    await tx.objectStore('visited').delete(key)
    await tx.objectStore('snapshots').delete(key)
    await tx.done
  })
}

export async function clearVisitedStore(): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction([
      'visited',
      'snapshots',
    ], 'readwrite')
    await tx.objectStore('visited').clear()
    await tx.objectStore('snapshots').clear()
    await tx.done
  })
}

/** 一次性把 zustand persist 留在 localStorage 的旧记录搬进 IndexedDB */
export async function migrateLegacyVisited(): Promise<void> {
  if (typeof localStorage === 'undefined')
    return

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw)
    return

  try {
    const parsed = JSON.parse(raw) as { state?: { items?: VisitedItem[] } }
    const legacyItems = parsed.state?.items ?? []

    const migrated = await withDb(async (db) => {
      const tx = db.transaction('visited', 'readwrite')
      const store = tx.objectStore('visited')
      for (const item of legacyItems)
        await store.put(toRecord(item))
      await tx.done
      return true
    })

    if (migrated)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
  catch (error) {
    console.warn('[storage] migrate legacy visited history failed:', error)
  }
}
