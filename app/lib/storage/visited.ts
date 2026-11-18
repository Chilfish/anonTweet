import type { StoredVisited } from './db'
import type { VisitedEvent, VisitedItem, VisitedType } from '~/lib/visited'
import {
  VISIT_EVENT_LIMIT,
  VISITED_LIMIT,
  VISITED_MEMORY_LIMIT,
  visitedKey,
} from '~/lib/visited'
import { withDb } from './db'

/** 持久化保留的去重记录数 */
export const VISITED_STORAGE_LIMIT = VISITED_LIMIT
/** 一次水合进内存的条数（首页只展示 HOME_RECENT_LIMIT 条） */
export const VISITED_HYDRATE_LIMIT = VISITED_MEMORY_LIMIT

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
      'visits',
    ], 'readwrite')
    const store = tx.objectStore('visited')
    const snapshots = tx.objectStore('snapshots')
    const visits = tx.objectStore('visits')
    const key = visitedKey(item)
    const ts = item.ts ?? Date.now()
    const existing = await store.get(key)

    await store.put(toRecord({
      ...item,
      ts,
      firstTs: existing?.firstTs ?? existing?.ts ?? ts,
      visits: existing
        ? (existing.visits ?? 1) + 1
        : 1,
    }))
    await visits.add({
      ts,
      type: item.type,
      targetId: item.id,
    })

    let visitCount = await visits.count()
    if (visitCount > VISIT_EVENT_LIMIT) {
      let cursor = await visits.index('ts').openCursor()
      while (cursor && visitCount > VISIT_EVENT_LIMIT) {
        await cursor.delete()
        visitCount -= 1
        cursor = await cursor.continue()
      }
    }

    let count = await store.count()
    if (count > VISITED_STORAGE_LIMIT) {
      let cursor = await store.index('ts').openCursor()
      while (cursor && count > VISITED_STORAGE_LIMIT) {
        // 摘要淘汰时同事务删掉详情快照，避免留下孤儿数据；访问事件保留为历史
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
        firstTs: stored.firstTs,
        visits: stored.visits,
        author: stored.author,
        authorHandle: stored.authorHandle,
      })
      cursor = await cursor.continue()
    }
    await tx.done
    return result
  })

  return items ?? []
}

/** 读取访问事件（时间倒序），用于热力图 / 时段统计 */
export async function loadVisitEvents(
  limit = VISIT_EVENT_LIMIT,
): Promise<VisitedEvent[]> {
  const events = await withDb(async (db) => {
    const tx = db.transaction('visits', 'readonly')
    const index = tx.objectStore('visits').index('ts')
    const result: VisitedEvent[] = []

    let cursor = await index.openCursor(null, 'prev')
    while (cursor && result.length < limit) {
      const stored = cursor.value
      result.push({
        ts: stored.ts,
        type: stored.type,
        targetId: stored.targetId,
      })
      cursor = await cursor.continue()
    }
    await tx.done
    return result
  })

  return events ?? []
}

export async function loadRecentVisited(
  limit = VISITED_HYDRATE_LIMIT,
): Promise<VisitedItem[]> {
  return loadVisitedHistory(limit)
}

export async function removeVisitedRecord(key: string): Promise<void> {
  const separator = key.indexOf(':')
  const type = key.slice(0, separator) as VisitedType
  const targetId = key.slice(separator + 1)

  await withDb(async (db) => {
    const tx = db.transaction([
      'visited',
      'snapshots',
      'visits',
    ], 'readwrite')
    await tx.objectStore('visited').delete(key)
    await tx.objectStore('snapshots').delete(key)

    if (separator > 0) {
      const visits = tx.objectStore('visits')
      let cursor = await visits.index('typeId').openCursor([type, targetId])
      while (cursor) {
        await cursor.delete()
        cursor = await cursor.continue()
      }
    }
    await tx.done
  })
}

export async function clearVisitedStore(): Promise<void> {
  await withDb(async (db) => {
    const tx = db.transaction([
      'visited',
      'snapshots',
      'visits',
    ], 'readwrite')
    await tx.objectStore('visited').clear()
    await tx.objectStore('snapshots').clear()
    await tx.objectStore('visits').clear()
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
      const tx = db.transaction([
        'visited',
        'visits',
      ], 'readwrite')
      const store = tx.objectStore('visited')
      const visits = tx.objectStore('visits')
      for (const item of legacyItems) {
        await store.put(toRecord(item))
        await visits.add({
          ts: item.ts,
          type: item.type,
          targetId: item.id,
        })
      }
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
