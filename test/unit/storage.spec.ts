import { beforeEach, describe, expect, it, vi } from 'vitest'
import { closeDb } from '~/lib/storage/db'
import {
  clearDictionaryStore,
  deleteDictionaryEntry,
  loadDictionaryEntries,
  migrateLegacyDictionary,
  putDictionaryEntries,
  putDictionaryEntry,
} from '~/lib/storage/dictionary'
import {
  loadRecentVisited,
  migrateLegacyVisited,
  recordVisited,
  VISITED_STORAGE_LIMIT,
} from '~/lib/storage/visited'
/**
 * test/unit/storage.spec.ts
 *
 * AC-HOME-003：IndexedDB 本地存储层——按记录写入、按时间取最近、超限淘汰、
 * 词典增删与 localStorage 旧数据迁移。
 *
 * fake-indexeddb 提供内存实现；每个用例先关连接并删库，避免数据串场。
 */
import 'fake-indexeddb/auto'

const DB_NAME = 'anon-tweet'

/** unit 项目没有 DOM localStorage，用内存实现覆盖迁移用例 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: key => map.get(key) ?? null,
    key: index => [
      ...map.keys(),
    ][index] ?? null,
    removeItem: (key) => {
      map.delete(key)
    },
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })
}

beforeEach(async () => {
  await closeDb()
  await deleteDatabase()
  vi.stubGlobal('localStorage', createMemoryStorage())
})

describe('AC-HOME-003: IndexedDB storage layer', () => {
  it('records entries newest first and dedupes by type + id', async () => {
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'first',
      ts: 100,
    })
    await recordVisited({
      type: 'tweet',
      id: '2',
      title: 'second',
      ts: 200,
    })
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'first-updated',
      ts: 300,
    })

    const items = await loadRecentVisited(10)
    expect(items.map(item => item.id)).toEqual(['1', '2'])
    expect(items[0]?.title).toBe('first-updated')
    expect(items[0]?.ts).toBe(300)
  })

  it('trims the oldest records beyond VISITED_STORAGE_LIMIT', async () => {
    for (let i = 0; i <= VISITED_STORAGE_LIMIT + 2; i += 1) {
      await recordVisited({
        type: 'tweet',
        id: `id-${i}`,
        title: `t-${i}`,
        ts: i,
      })
    }

    const all = await loadRecentVisited(VISITED_STORAGE_LIMIT + 10)
    expect(all).toHaveLength(VISITED_STORAGE_LIMIT)
    expect(all[0]?.id).toBe(`id-${VISITED_STORAGE_LIMIT + 2}`)
    expect(all.some(item => item.id === 'id-0')).toBe(false)
  })

  it('updates, removes and clears the dictionary', async () => {
    await putDictionaryEntries([
      {
        id: 'a',
        original: 'foo',
        translated: '福',
        createdAt: 1,
      },
      {
        id: 'b',
        original: 'bar',
        translated: '巴',
        createdAt: 2,
      },
    ])
    await putDictionaryEntry({
      id: 'a',
      original: 'foo',
      translated: '福气',
      createdAt: 1,
    })

    const loaded = await loadDictionaryEntries()
    expect(loaded.map(e => e.id)).toEqual(['b', 'a'])
    expect(loaded.find(e => e.id === 'a')?.translated).toBe('福气')

    await deleteDictionaryEntry('b')
    expect((await loadDictionaryEntries()).map(e => e.id)).toEqual(['a'])

    await clearDictionaryStore()
    expect(await loadDictionaryEntries()).toEqual([])
  })

  it('migrates legacy localStorage payloads once', async () => {
    localStorage.setItem('visited-store', JSON.stringify({
      state: {
        items: [
          {
            type: 'tweet',
            id: '9',
            title: 'legacy',
            ts: 5,
          },
        ],
      },
    }))
    localStorage.setItem('translation-dictionary-storage', JSON.stringify({
      state: {
        entries: [
          {
            id: 'd1',
            original: 'x',
            translated: '叉',
            createdAt: 1,
          },
        ],
      },
    }))

    await migrateLegacyVisited()
    await migrateLegacyDictionary()

    expect((await loadRecentVisited()).map(item => item.id)).toEqual(['9'])
    expect((await loadDictionaryEntries()).map(entry => entry.id)).toEqual(['d1'])
    expect(localStorage.getItem('visited-store')).toBeNull()
    expect(localStorage.getItem('translation-dictionary-storage')).toBeNull()
  })
})
