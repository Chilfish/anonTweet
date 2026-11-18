import { create } from 'zustand'
import { clearSearchHistory, loadRecentSearches, recordSearch } from '~/lib/storage/searches'

const MEMORY_LIMIT = 10

interface SearchHistoryState {
  _hasHydrated: boolean
  queries: string[]
  hydrate: () => Promise<void>
  record: (query: string) => void
  clear: () => void
}

export const useSearchHistoryStore = create<SearchHistoryState>()(set => ({
  _hasHydrated: false,
  queries: [],

  hydrate: async () => {
    if (typeof indexedDB === 'undefined') {
      set({ _hasHydrated: true })
      return
    }
    const queries = await loadRecentSearches(MEMORY_LIMIT)
    set({ queries, _hasHydrated: true })
  },

  record: (query) => {
    const trimmed = query.trim()
    if (!trimmed)
      return
    set(state => ({
      queries: [
        trimmed,
        ...state.queries.filter(q => q !== trimmed),
      ].slice(0, MEMORY_LIMIT),
    }))
    void recordSearch(trimmed)
  },

  clear: () => {
    set({ queries: [] })
    void clearSearchHistory()
  },
}))

let hydrationPromise: Promise<void> | null = null

/** 幂等水合：root 启动时调用，搜索页再兜底一次 */
export function ensureSearchHistoryHydrated(): Promise<void> {
  if (!hydrationPromise)
    hydrationPromise = useSearchHistoryStore.getState().hydrate()
  return hydrationPromise
}
