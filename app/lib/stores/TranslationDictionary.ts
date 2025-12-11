import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

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
  entries: TranslationDicEntry[]
  // Actions
  addEntry: (entry: Omit<TranslationDicEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<TranslationDicEntry>) => void
  /**
   * 导入词条
   * @returns 导入结果统计 { added, skipped }
   */
  importEntries: (entries: TranslationDicEntry[]) => ImportResult
  clearEntries: () => void
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export const useTranslationDictionaryStore = create<TranslationDictionaryState>()(
  persist(
    (set, get) => ({
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
        // 创建现有原文的 Set 用于快速查找 (大小写敏感视需求而定，这里保持原样)
        const existingOriginals = new Set(currentEntries.map(e => e.original))

        const uniqueNew = newEntries.filter(e => !existingOriginals.has(e.original))

        if (uniqueNew.length > 0) {
          set({ entries: [...uniqueNew, ...currentEntries] })
        }

        return {
          added: uniqueNew.length,
          skipped: newEntries.length - uniqueNew.length,
        }
      },

      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: 'translation-dictionary-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
