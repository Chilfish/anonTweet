import type { EnrichedTweet, IGPost } from '~/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SNAPSHOT_LIMIT } from '~/lib/snapshot'
import { loadIgSnapshot, loadTweetSnapshot } from '~/lib/snapshot-restore'
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
  clearSnapshots,
  getSnapshot,
  putSnapshot,
} from '~/lib/storage/snapshots'
import {
  clearVisitedStore,
  loadRecentVisited,
  loadVisitedHistory,
  loadVisitEvents,
  migrateLegacyVisited,
  recordVisited,
  removeVisitedRecord,
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
    expect(items[0]?.firstTs).toBe(100)
    expect(items[0]?.visits).toBe(2)
  })

  it('logs visit events and deletes them with the record', async () => {
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'one',
      ts: 100,
    })
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'one',
      ts: 200,
    })
    await recordVisited({
      type: 'tweet',
      id: '2',
      title: 'two',
      ts: 300,
    })

    expect((await loadVisitEvents()).map(event => event.ts)).toEqual([
      300,
      200,
      100,
    ])

    await removeVisitedRecord('tweet:1')
    expect((await loadVisitEvents()).map(event => event.targetId)).toEqual(['2'])

    await clearVisitedStore()
    expect(await loadVisitEvents()).toEqual([])
  })

  it('backfills visit events when upgrading an existing v3 database', async () => {
    await closeDb()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 3)
      request.onupgradeneeded = () => {
        const db = request.result
        const visited = db.createObjectStore('visited', { keyPath: 'key' })
        visited.createIndex('ts', 'ts')
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('visited', 'readwrite')
        tx.objectStore('visited').put({
          key: 'tweet:legacy',
          type: 'tweet',
          id: 'legacy',
          title: 'legacy',
          ts: 123,
        })
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })

    expect((await loadVisitEvents()).map(event => event.ts)).toEqual([123])
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
    expect((await loadVisitEvents()).map(event => event.ts)).toEqual([5])
    expect((await loadDictionaryEntries()).map(entry => entry.id)).toEqual(['d1'])
    expect(localStorage.getItem('visited-store')).toBeNull()
    expect(localStorage.getItem('translation-dictionary-storage')).toBeNull()
  })
})

function tweetSnapshot(id: string, savedAt: number) {
  return {
    key: `tweet:${id}`,
    type: 'tweet' as const,
    id,
    tweets: [],
    translations: {},
    savedAt,
  }
}

describe('AC-HOME-005: detail snapshots share lifecycle with visited records', () => {
  it('stores and reads a snapshot by type + id, overwriting on the same key', async () => {
    await putSnapshot({
      ...tweetSnapshot('1', 100),
      translations: { 1: null },
    })
    await putSnapshot({
      ...tweetSnapshot('1', 200),
      translations: {},
    })
    await putSnapshot({
      key: 'ig:abc',
      type: 'ig',
      id: 'abc',
      posts: [],
      savedAt: 150,
    })

    const stored = await getSnapshot('tweet:1')
    expect(stored?.savedAt).toBe(200)
    expect((await getSnapshot('ig:abc'))?.type).toBe('ig')
    expect(await getSnapshot('tweet:missing')).toBeNull()
  })

  it('loads snapshots locally regardless of age', async () => {
    await putSnapshot({
      ...tweetSnapshot('1', 0),
      tweets: [
        { id: '1' } as EnrichedTweet,
      ],
    })
    await putSnapshot({
      key: 'ig:abc',
      type: 'ig',
      id: 'abc',
      posts: [
        { id: 'abc' } as IGPost,
      ],
      savedAt: 0,
    })

    expect((await loadTweetSnapshot('1'))?.id).toBe('1')
    expect(await loadIgSnapshot('abc')).toHaveLength(1)
  })

  it('prunes the oldest snapshots beyond SNAPSHOT_LIMIT', async () => {
    for (let i = 0; i <= SNAPSHOT_LIMIT + 2; i += 1)
      await putSnapshot(tweetSnapshot(`id-${i}`, i))

    expect(await getSnapshot('tweet:id-0')).toBeNull()
    expect(await getSnapshot(`tweet:id-${SNAPSHOT_LIMIT + 2}`)).not.toBeNull()
  })

  it('removes the matching snapshot when a record or the whole history is cleared', async () => {
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'one',
      ts: 1,
    })
    await putSnapshot(tweetSnapshot('1', 1))
    await recordVisited({
      type: 'tweet',
      id: '2',
      title: 'two',
      ts: 2,
    })
    await putSnapshot(tweetSnapshot('2', 2))

    await removeVisitedRecord('tweet:1')
    expect(await getSnapshot('tweet:1')).toBeNull()
    expect(await getSnapshot('tweet:2')).not.toBeNull()

    await clearVisitedStore()
    expect(await getSnapshot('tweet:2')).toBeNull()
    expect((await loadVisitedHistory()).length).toBe(0)
  })

  it('drops a snapshot when its visited record is evicted by the storage cap', async () => {
    await recordVisited({
      type: 'tweet',
      id: 'oldest',
      title: 'oldest',
      ts: -1,
    })
    await putSnapshot(tweetSnapshot('oldest', 0))

    for (let i = 0; i < VISITED_STORAGE_LIMIT; i += 1) {
      await recordVisited({
        type: 'tweet',
        id: `id-${i}`,
        title: `t-${i}`,
        ts: i,
      })
    }
    await recordVisited({
      type: 'tweet',
      id: 'fresh',
      title: 'fresh',
      ts: 10_000,
    })

    expect(await getSnapshot('tweet:oldest')).toBeNull()
  })

  it('clears snapshots without touching visited records', async () => {
    await recordVisited({
      type: 'tweet',
      id: '1',
      title: 'one',
      ts: 1,
    })
    await putSnapshot(tweetSnapshot('1', 1))

    await clearSnapshots()

    expect(await getSnapshot('tweet:1')).toBeNull()
    expect((await loadVisitedHistory()).map(item => item.id)).toEqual(['1'])
  })
})
