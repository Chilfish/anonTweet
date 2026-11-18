import type { VisitedItem } from '~/lib/visited'
import { create } from 'zustand'
import {
  clearVisitedStore,
  loadRecentVisited,
  migrateLegacyVisited,
  recordVisited,
  removeVisitedRecord,
} from '~/lib/storage/visited'
import { pushVisited, VISITED_MEMORY_LIMIT, visitedKey } from '~/lib/visited'

interface VisitedState {
  /** IndexedDB 水合完成前不渲染列表，避免 SSR/首帧空态闪烁 */
  _hasHydrated: boolean
  items: VisitedItem[]
  hydrate: () => Promise<void>
  record: (item: Omit<VisitedItem, 'ts'>) => void
  remove: (key: string) => void
  clear: () => void
}

export const useVisitedStore = create<VisitedState>()(set => ({
  _hasHydrated: false,
  items: [],

  hydrate: async () => {
    if (typeof indexedDB === 'undefined') {
      set({ _hasHydrated: true })
      return
    }
    await migrateLegacyVisited()
    const items = await loadRecentVisited()
    set({ items, _hasHydrated: true })
  },

  record: (item) => {
    set(state => ({
      items: pushVisited(state.items, item).slice(0, VISITED_MEMORY_LIMIT),
    }))
    void recordVisited(item)
  },

  remove: (key) => {
    set(state => ({
      items: state.items.filter(item => visitedKey(item) !== key),
    }))
    void removeVisitedRecord(key)
  },

  clear: () => {
    set({ items: [] })
    void clearVisitedStore()
  },
}))

let hydrationPromise: Promise<void> | null = null

/** 幂等水合：root 与首页都调用也只读一次 IndexedDB */
export function ensureVisitedHydrated(): Promise<void> {
  if (!hydrationPromise)
    hydrationPromise = useVisitedStore.getState().hydrate()
  return hydrationPromise
}
