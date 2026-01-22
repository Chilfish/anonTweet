import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  entries: TranslationDicEntry[]
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

export const useTranslationDictionaryStore = create<TranslationDictionaryState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: state => set({ _hasHydrated: state }),
      entries: [],

      addEntry: entry => set(state => ({
        entries: [
          {
            ...entry,
            id: generateId(),
            createdAt: Date.now(),
          },
          ...state.entries,
        ],
      })),

      removeEntry: id => set(state => ({
        entries: state.entries.filter(e => e.id !== id),
      })),

      updateEntry: (id, updates) => set(state => ({
        entries: state.entries.map(e =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      })),

      importEntries: (newEntries) => {
        const currentEntries = get().entries
        // 创建现有原文的 Set 用于快速查找
        const existingOriginals = new Set(currentEntries.map(e => e.original))

        const uniqueNew = newEntries
          .filter(e => !existingOriginals.has(e.original))
          .map(e => ({
            ...e,
            id: generateId(),
            createdAt: Date.now(),
          }))

        if (uniqueNew.length > 0) {
          set({ entries: [...uniqueNew, ...currentEntries] })
        }

        return {
          added: uniqueNew.length,
          skipped: newEntries.length - uniqueNew.length,
        }
      },

      clearEntries: () => set({ entries: [] }),

      getFormattedEntries: () => {
        const { entries } = get()
        return entries.map(e => `${e.original} -> ${e.translated}`).join('\n')
      },
    }),
    {
      name: 'translation-dictionary-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true)
      },
      partialize: state => ({
        entries: state.entries,
      }),
    },
  ),
)
