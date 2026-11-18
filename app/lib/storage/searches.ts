import { withDb } from './db'

/** 搜索历史保留条数（去重后） */
export const SEARCH_HISTORY_LIMIT = 20

/** 同一毫秒内连续搜索时也要有稳定顺序，避免索引按主键兜底 */
let lastTs = 0
function nextTs(): number {
  lastTs = Math.max(Date.now(), lastTs + 1)
  return lastTs
}

export async function recordSearch(query: string): Promise<void> {
  const trimmed = query.trim()
  if (!trimmed)
    return

  await withDb(async (db) => {
    const tx = db.transaction('searches', 'readwrite')
    const store = tx.objectStore('searches')
    await store.put({
      query: trimmed,
      ts: nextTs(),
    })

    let count = await store.count()
    if (count > SEARCH_HISTORY_LIMIT) {
      let cursor = await store.index('ts').openCursor()
      while (cursor && count > SEARCH_HISTORY_LIMIT) {
        await cursor.delete()
        count -= 1
        cursor = await cursor.continue()
      }
    }
    await tx.done
  })
}

export async function loadRecentSearches(
  limit = SEARCH_HISTORY_LIMIT,
): Promise<string[]> {
  const queries = await withDb(async (db) => {
    const tx = db.transaction('searches', 'readonly')
    const index = tx.objectStore('searches').index('ts')
    const result: string[] = []

    let cursor = await index.openCursor(null, 'prev')
    while (cursor && result.length < limit) {
      result.push(cursor.value.query)
      cursor = await cursor.continue()
    }
    await tx.done
    return result
  })

  return queries ?? []
}

export async function clearSearchHistory(): Promise<void> {
  await withDb(async (db) => {
    await db.clear('searches')
  })
}
