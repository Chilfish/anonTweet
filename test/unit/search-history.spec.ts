import { beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDb } from '~/lib/storage/db'
import {
  clearSearchHistory,
  loadRecentSearches,
  recordSearch,
  SEARCH_HISTORY_LIMIT,
} from '~/lib/storage/searches'
/**
 * test/unit/search-history.spec.ts
 *
 * AC-SEARCH-001：最近搜索存储层——去重、上限、倒序与清空。
 */
import 'fake-indexeddb/auto'

const DB_NAME = 'anon-tweet'

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })
}

beforeEach(async () => {
  await closeDb()
  await deleteDatabase()
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } satisfies Storage)
})

describe('AC-SEARCH-001: recent search storage', () => {
  it('dedupes queries and returns the newest first', async () => {
    await recordSearch('cat')
    await recordSearch('dog')
    await recordSearch('cat')

    expect(await loadRecentSearches()).toEqual(['cat', 'dog'])
  })

  it('ignores blank queries', async () => {
    await recordSearch('   ')
    expect(await loadRecentSearches()).toEqual([])
  })

  it('caps the history at SEARCH_HISTORY_LIMIT', async () => {
    for (let i = 0; i <= SEARCH_HISTORY_LIMIT + 2; i += 1)
      await recordSearch(`q-${i}`)

    const queries = await loadRecentSearches(SEARCH_HISTORY_LIMIT + 10)
    expect(queries).toHaveLength(SEARCH_HISTORY_LIMIT)
    expect(queries[0]).toBe(`q-${SEARCH_HISTORY_LIMIT + 2}`)
    expect(queries).not.toContain('q-0')
  })

  it('clears the history', async () => {
    await recordSearch('cat')
    await clearSearchHistory()
    expect(await loadRecentSearches()).toEqual([])
  })
})
