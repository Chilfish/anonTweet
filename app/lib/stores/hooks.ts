import { useShallow } from 'zustand/react/shallow'
import { useTranslationStore } from './translation'
import { useTranslationUIStore } from './translationUI'

/**
 * 专门用于获取操作函数。
 * 原理：我们只订阅 actions 部分，由于 Zustand 的 actions 函数引用是稳定的，
 * 所以这个 Hook 永远不会导致组件因数据变化而重渲染。
 */
export function useTranslationActions() {
  return useTranslationStore(
    useShallow(state => ({
      updateSettings: state.updateSettings,
      resetSettings: state.resetSettings,
      selectTemplate: state.selectTemplate,
      updateTemplate: state.updateTemplate,
      addTemplate: state.addTemplate,
      deleteTemplate: state.deleteTemplate,
      addCustomTemplate: state.addCustomTemplate,
      updateCustomTemplate: state.updateCustomTemplate,
      deleteCustomTemplate: state.deleteCustomTemplate,
      setAllTweets: state.setAllTweets,
      appendTweets: state.appendTweets,
      setCommentsCount: state.setCommentsCount,
      setTranslation: state.setTranslation,
      // 注意：getTranslation 是 getter，不应在渲染期间直接作为数据源依赖，
      // 而是应该在事件回调中使用，或者使用下方的 useTweetTranslation
      getTranslation: state.getTranslation,
      deleteTranslation: state.deleteTranslation,
      resetTranslation: state.resetTranslation,
      setTranslationVisibility: state.setTranslationVisibility,
      setTweetTranslationMode: state.setTweetTranslationMode,
      setTranslationMode: state.setTranslationMode,
      hasTextContent: state.hasTextContent,
    })),
  )
}

// UI Store 的 Actions
export function useTranslationUIActions() {
  return useTranslationUIStore(
    useShallow(state => ({
      setShowTranslationButton: state.setShowTranslationButton,
      setEditingTweetId: state.setEditingTweetId,
      setTweetElRef: state.setTweetElRef,
      setScreenshoting: state.setScreenshoting,
      toggleSelectionMode: state.toggleSelectionMode,
      toggleTweetSelection: state.toggleTweetSelection,
      selectAllTweets: state.selectAllTweets,
      setIsCapturingSelected: state.setIsCapturingSelected,
      resetUI: state.resetUI,
    })),
  )
}

/**
 * 获取单个推文的翻译数据
 * 只有当这个特定推文的翻译发生变化时，组件才会重渲染
 */
export function useTweetTranslation(tweetId: string) {
  return useTranslationStore(state => state.translations[tweetId])
}

/**
 * 获取单个推文的可见性设置
 * 只有当可见性变化时重渲染
 */
export function useTweetVisibility(tweetId: string) {
  return useTranslationStore(state =>
    state.translationVisibility[tweetId] || { body: true, alt: true },
  )
}

/**
 * 获取特定推文的翻译模式
 */
export function useTweetMode(tweetId: string) {
  return useTranslationStore(state =>
    state.tweetTranslationModes[tweetId] || state.translationMode,
  )
}

/**
 * 获取全局设置 (Settings)
 * 使用 useShallow 防止每次 settings 对象引用变化导致重渲染
 */
export function useTranslationSettings() {
  return useTranslationStore(useShallow(state => state.settings))
}

export function useUIState() {
  return useTranslationUIStore(
    useShallow(state => ({
      showTranslationButton: state.showTranslationButton,
      isSelectionMode: state.isSelectionMode,
      screenshoting: state.screenshoting,
      isCapturingSelected: state.isCapturingSelected,
      editingTweetId: state.editingTweetId,
      selectedTweetIds: state.selectedTweetIds,
      tweetElRef: state.tweetElRef,
    })),
  )
}

/**
 * 检查推文是否被选中
 */
export function useIsTweetSelected(tweetId: string) {
  return useTranslationUIStore(state => state.selectedTweetIds.includes(tweetId))
}

export function useSelectedCount() {
  return useTranslationUIStore(state => state.selectedTweetIds.length)
}

export function useTweets() {
  return useTranslationStore(useShallow(state => state.tweets))
}

export function useMainTweet() {
  return useTranslationStore(useShallow(state => state.mainTweet))
}

export function useCommentsCount() {
  return useTranslationStore(state => state.commentsCount)
}

export function useGlobalTranslationMode() {
  return useTranslationStore(
    useShallow(state => ({
      translationMode: state.translationMode,
      tweetTranslationModes: state.tweetTranslationModes,
    })),
  )
}

export function useTranslations() {
  return useTranslationStore(useShallow(state => state.translations))
}
