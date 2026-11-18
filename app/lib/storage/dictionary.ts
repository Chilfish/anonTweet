import type { TranslationDicEntry } from '~/lib/stores/TranslationDictionary'
import { withDb } from './db'

const LEGACY_STORAGE_KEY = 'translation-dictionary-storage'

export async function loadDictionaryEntries(): Promise<TranslationDicEntry[]> {
  const entries = await withDb(async db => db.getAll('dictionary'))
  return (entries ?? []).sort((a, b) => b.createdAt - a.createdAt)
}

export async function putDictionaryEntry(entry: TranslationDicEntry): Promise<void> {
  await withDb(async (db) => {
    await db.put('dictionary', entry)
  })
}

export async function putDictionaryEntries(entries: TranslationDicEntry[]): Promise<void> {
  if (!entries.length)
    return
  await withDb(async (db) => {
    const tx = db.transaction('dictionary', 'readwrite')
    for (const entry of entries)
      await tx.store.put(entry)
    await tx.done
  })
}

export async function deleteDictionaryEntry(id: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete('dictionary', id)
  })
}

export async function clearDictionaryStore(): Promise<void> {
  await withDb(async (db) => {
    await db.clear('dictionary')
  })
}

/** 一次性把 zustand persist 留下的词典搬进 IndexedDB */
export async function migrateLegacyDictionary(): Promise<void> {
  if (typeof localStorage === 'undefined')
    return

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw)
    return

  try {
    const parsed = JSON.parse(raw) as { state?: { entries?: TranslationDicEntry[] } }
    const legacyEntries = parsed.state?.entries ?? []

    const migrated = await withDb(async (db) => {
      const tx = db.transaction('dictionary', 'readwrite')
      for (const entry of legacyEntries)
        await tx.store.put(entry)
      await tx.done
      return true
    })

    if (migrated)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
  }
  catch (error) {
    console.warn('[storage] migrate legacy dictionary failed:', error)
  }
}
