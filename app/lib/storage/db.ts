import type { DBSchema, IDBPDatabase } from 'idb'
import type { ArticleTranslation } from '~/lib/article/translate'
import type { TranslationDicEntry } from '~/lib/stores/TranslationDictionary'
import type { VisitedItem, VisitedType } from '~/lib/visited'
import type { EnrichedTweet, Entity, IGPostData, TweetData } from '~/types'
import { openDB } from 'idb'

/** IndexedDB 中的访问记录（多一个 key 字段做主键） */
export interface StoredVisited extends VisitedItem {
  key: string
}

interface SnapshotBase {
  /** 与 visited 相同：`${type}:${id}` */
  key: string
  type: VisitedType
  id: string
  /** 最后写入时间（epoch ms），用于淘汰 */
  savedAt: number
}

/** 推文 / 长文的完整详情快照 */
export interface TweetSnapshot extends SnapshotBase {
  type: 'tweet' | 'article'
  /** store 形态的推文线程（entities 中的译文已被剥离到 translations） */
  tweets: TweetData
  /** 逐推文译文（手动编辑或 AI 翻译），按 tweet id 索引 */
  translations: Record<string, Entity[] | null>
  articleTranslation?: ArticleTranslation | null
  /** 文章内嵌推文 */
  embeds?: Record<string, EnrichedTweet | null>
}

/** Instagram 帖子列表快照（含 caption 译文） */
export interface IgSnapshot extends SnapshotBase {
  type: 'ig'
  posts: IGPostData
}

export type SnapshotRecord = TweetSnapshot | IgSnapshot

export interface StoredSearch {
  /** 去重键：搜索关键词本身 */
  query: string
  ts: number
}

export interface AnonDB extends DBSchema {
  visited: {
    key: string
    value: StoredVisited
    indexes: { ts: number }
  }
  dictionary: {
    key: string
    value: TranslationDicEntry
    indexes: { original: string }
  }
  searches: {
    key: string
    value: StoredSearch
    indexes: { ts: number }
  }
  snapshots: {
    key: string
    value: SnapshotRecord
    indexes: { savedAt: number }
  }
}

const DB_NAME = 'anon-tweet'
const DB_VERSION = 3

let dbPromise: Promise<IDBPDatabase<AnonDB>> | null = null

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

function getDb(): Promise<IDBPDatabase<AnonDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AnonDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('visited')) {
          const visited = db.createObjectStore('visited', { keyPath: 'key' })
          visited.createIndex('ts', 'ts')
        }
        if (!db.objectStoreNames.contains('dictionary')) {
          // original 非唯一：历史数据可能存在同词重复项，去重由 store 负责
          const dictionary = db.createObjectStore('dictionary', { keyPath: 'id' })
          dictionary.createIndex('original', 'original')
        }
        if (!db.objectStoreNames.contains('searches')) {
          const searches = db.createObjectStore('searches', { keyPath: 'query' })
          searches.createIndex('ts', 'ts')
        }
        if (!db.objectStoreNames.contains('snapshots')) {
          const snapshots = db.createObjectStore('snapshots', { keyPath: 'key' })
          snapshots.createIndex('savedAt', 'savedAt')
        }
      },
    }).catch((error) => {
      // 打开失败（隐私模式 / 被策略禁用）后允许下次重试
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

/**
 * 在 IndexedDB 可用时执行；不可用或打开失败返回 null。
 * 调用方需要把 null 当作「无持久化」，退回内存态，而不是抛错打断渲染。
 */
export async function withDb<T>(
  fn: (db: IDBPDatabase<AnonDB>) => Promise<T>,
): Promise<T | null> {
  if (!isIndexedDbAvailable())
    return null
  try {
    return await fn(await getDb())
  }
  catch (error) {
    console.error('[storage] IndexedDB operation failed:', error)
    return null
  }
}

/** 关闭连接并清空缓存（测试与需要重置存储时使用） */
export async function closeDb(): Promise<void> {
  if (!dbPromise)
    return
  const db = await dbPromise.catch(() => null)
  db?.close()
  dbPromise = null
}
