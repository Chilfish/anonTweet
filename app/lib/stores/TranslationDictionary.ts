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
  importEntries: (entries: Omit<TranslationDicEntry, 'id' | 'createdAt'>[]) => ImportResult
  clearEntries: () => void
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export async function downloadExcel(entries: TranslationDicEntry[]) {
  const XLSX = await import('xlsx')
  const data = entries.map(e => ({
    原文: e.original,
    译文: e.translated,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dictionary')
  XLSX.writeFile(wb, `翻译对照表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function parseExcel(data: ArrayBuffer): Promise<Omit<TranslationDicEntry, 'id' | 'createdAt'>[]> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(data, { type: 'array' })
  const wsName = wb.SheetNames[0]
  if (!wsName)
    return []
  const ws = wb.Sheets[wsName]!
  const jsonData = XLSX.utils.sheet_to_json<any>(ws)

  return jsonData
    .map((item) => {
      // Try to find fields by common names (case-insensitive or Chinese)
      const keys = Object.keys(item)
      const originalKey = keys.find(k => k.toLowerCase() === 'original' || k === '原文')
      const translatedKey = keys.find(k => k.toLowerCase() === 'translated' || k === '译文')

      if (originalKey && translatedKey) {
        return {
          original: String(item[originalKey]),
          translated: String(item[translatedKey]),
        }
      }
      return null
    })
    .filter((e): e is Omit<TranslationDicEntry, 'id' | 'createdAt'> =>
      e !== null && Boolean(e.original.trim()) && Boolean(e.translated.trim()),
    )
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
    }),
    {
      name: 'translation-dictionary-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
