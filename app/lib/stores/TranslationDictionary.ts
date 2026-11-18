import { create } from 'zustand'
import {
  clearDictionaryStore,
  deleteDictionaryEntry,
  loadDictionaryEntries,
  migrateLegacyDictionary,
  putDictionaryEntries,
  putDictionaryEntry,
} from '~/lib/storage/dictionary'
import { generateId } from '~/lib/utils'

export interface TranslationDicEntry {
  id: string
  original: string
  translated: string
  createdAt: number
}

interface ImportResult {
  added: number
  skipped: number
}

interface TranslationDictionaryState {
  /** IndexedDB 水合完成标记（SSR 恒为 false） */
  _hasHydrated: boolean
  entries: TranslationDicEntry[]
  hydrate: () => Promise<void>
  // Actions
  addEntry: (entry: Omit<TranslationDicEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<TranslationDicEntry>) => void
  /**
   * 导入词条
   * @returns 导入结果统计 { added, skipped }
   */
  importEntries: (entries: Omit<TranslationDicEntry, 'id' | 'createdAt'>[]) => ImportResult
  clearEntries: () => void
  getFormattedEntries: () => string
}

/**
 * 词典：内存态 + IndexedDB 写穿。
 *
 * 相比 localStorage 整表重写，按记录存放后新增/删除只写单条，词条数上万也
 * 不会阻塞主线程；读取方（翻译/识图）在发请求前 await `ensureDictionaryHydrated()`，
 * 保证术语表不因异步水合而丢失。
 */
export const useTranslationDictionaryStore = create<TranslationDictionaryState>()(
  (set, get) => ({
    _hasHydrated: false,
    entries: [],

    hydrate: async () => {
      if (typeof indexedDB === 'undefined') {
        set({ _hasHydrated: true })
        return
      }
      await migrateLegacyDictionary()
      const entries = await loadDictionaryEntries()
      set({ entries, _hasHydrated: true })
    },

    addEntry: (entry) => {
      const full: TranslationDicEntry = {
        ...entry,
        id: generateId(),
        createdAt: Date.now(),
      }
      set(state => ({
        entries: [full, ...state.entries],
      }))
      void putDictionaryEntry(full)
    },

    removeEntry: (id) => {
      set(state => ({
        entries: state.entries.filter(e => e.id !== id),
      }))
      void deleteDictionaryEntry(id)
    },

    updateEntry: (id, updates) => {
      const current = get().entries.find(e => e.id === id)
      if (!current)
        return
      const next: TranslationDicEntry = {
        ...current,
        ...updates,
      }
      set(state => ({
        entries: state.entries.map(e => e.id === id
          ? next
          : e),
      }))
      void putDictionaryEntry(next)
    },

    importEntries: (newEntries) => {
      const currentEntries = get().entries
      const existingOriginals = new Set(currentEntries.map(e => e.original))

      const uniqueNew = newEntries
        .filter(e => !existingOriginals.has(e.original))
        .map(e => ({
          ...e,
          id: generateId(),
          createdAt: Date.now(),
        }))

      if (uniqueNew.length > 0) {
        set({
          entries: [
            ...uniqueNew,
            ...currentEntries,
          ],
        })
        void putDictionaryEntries(uniqueNew)
      }

      return {
        added: uniqueNew.length,
        skipped: newEntries.length - uniqueNew.length,
      }
    },

    clearEntries: () => {
      set({ entries: [] })
      void clearDictionaryStore()
    },

    getFormattedEntries: () => {
      return get().entries.map(e => `${e.original} -> ${e.translated}`).join('\n')
    },
  }),
)

let hydrationPromise: Promise<void> | null = null

/** 幂等水合：root 启动时调用；翻译/识图发请求前再 await 一次兜底 */
export function ensureDictionaryHydrated(): Promise<void> {
  if (!hydrationPromise)
    hydrationPromise = useTranslationDictionaryStore.getState().hydrate()
  return hydrationPromise
}
