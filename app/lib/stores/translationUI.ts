import { create } from 'zustand'
import { findDescendantIds } from './logic'
import { useTranslationStore } from './translation'

interface UIState {
  showTranslationButton: boolean
  editingTweetId: string | null
  tweetElRef: HTMLDivElement | null
  screenshoting: boolean
  isSelectionMode: boolean
  selectedTweetIds: string[]
  isCapturingSelected: boolean
}

interface UIActions {
  setShowTranslationButton: (show: boolean) => void
  setEditingTweetId: (tweetId: string | null) => void
  setTweetElRef: (ref: HTMLDivElement | null) => void
  setScreenshoting: (screenshoting: boolean) => void

  // Selection Logic
  toggleSelectionMode: (enabled?: boolean) => void
  toggleTweetSelection: (tweetId: string) => void
  selectAllTweets: (selected?: boolean) => void
  setIsCapturingSelected: (isCapturing: boolean) => void
  resetUI: () => void
}

export const useTranslationUIStore = create<UIState & UIActions>((set, get) => ({
  showTranslationButton: true,
  editingTweetId: null,
  tweetElRef: null,
  screenshoting: false,
  isSelectionMode: false,
  selectedTweetIds: [],
  isCapturingSelected: false,

  setShowTranslationButton: show => set({ showTranslationButton: show }),
  setEditingTweetId: tweetId => set({ editingTweetId: tweetId }),
  setTweetElRef: ref => set({ tweetElRef: ref }),
  setScreenshoting: screenshoting => set({ screenshoting }),
  setIsCapturingSelected: isCapturing => set({ isCapturingSelected: isCapturing }),

  toggleSelectionMode: enabled =>
    set((state) => {
      const nextMode = enabled ?? !state.isSelectionMode
      return {
        isSelectionMode: nextMode,
        selectedTweetIds: nextMode ? state.selectedTweetIds : [],
        isCapturingSelected: false,
      }
    }),

  toggleTweetSelection: (tweetId) => {
    const state = get()
    const { mainTweet, tweets } = useTranslationStore.getState()

    const isCurrentlySelected = state.selectedTweetIds.includes(tweetId)
    const shouldSelect = !isCurrentlySelected

    // 构建所有可用推文的扁平列表
    const allTweets = [
      ...(mainTweet ? [mainTweet] : []),
      ...tweets,
    ]

    let targetIds: string[] = [tweetId]
    const isMainTweet = mainTweet && mainTweet.id_str === tweetId

    // 保持原有逻辑：非主推文则递归选中后代
    if (!isMainTweet) {
      const descendantIds = findDescendantIds(allTweets, tweetId)
      targetIds = [...targetIds, ...descendantIds]
    }

    let newSelectedIds = [...state.selectedTweetIds]

    if (shouldSelect) {
      targetIds.forEach((id) => {
        if (!newSelectedIds.includes(id))
          newSelectedIds.push(id)
      })
    }
    else {
      newSelectedIds = newSelectedIds.filter(id => !targetIds.includes(id))
    }

    set({ selectedTweetIds: newSelectedIds })
  },

  selectAllTweets: (selected = true) => {
    if (!selected)
      return set({ selectedTweetIds: [] })

    const { mainTweet, tweets } = useTranslationStore.getState()
    const allIds = [
      ...(mainTweet ? [mainTweet.id_str] : []),
      ...tweets.map(t => t.id_str),
    ]
    set({ selectedTweetIds: allIds })
  },

  resetUI: () => set({
    isSelectionMode: false,
    selectedTweetIds: [],
    editingTweetId: null,
    screenshoting: false,
  }),
}))
