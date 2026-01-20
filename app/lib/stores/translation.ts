import type { SeparatorTemplate } from '~/lib/constants'
import type { EnrichedTweet, Entity, TweetData } from '~/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_TEMPLATES } from '~/lib/constants'
import { checkTextContent, extractTranslationsFromEntities, findDescendantIds } from './logic'

export type TranslationMode = 'bilingual' | 'original' | 'translation'

/**
 * 1. Settings Domain
 * 负责用户偏好、模板管理等持久化配置
 */
interface SettingsState {
  settings: {
    enabled: boolean
    customSeparator: string
    selectedTemplateId: string
    separatorTemplates: SeparatorTemplate[]
    customTemplates: SeparatorTemplate[]
  }
}

interface SettingsActions {
  updateSettings: (settings: Partial<SettingsState['settings']>) => void
  resetSettings: () => void

  // Template Management
  selectTemplate: (templateId: string) => void
  updateTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  addTemplate: (template: Omit<SeparatorTemplate, 'id'>) => void
  deleteTemplate: (templateId: string) => void

  // Custom Template Management
  addCustomTemplate: (template: Omit<SeparatorTemplate, 'id'>) => string
  updateCustomTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  deleteCustomTemplate: (templateId: string) => void
}

/**
 * 2. Data Domain
 * 负责核心业务数据、推文实体、翻译缓存
 */
interface DataState {
  tweets: TweetData
  mainTweet: EnrichedTweet | null
  commentsCount: number
  /** 缓存：推文ID -> 翻译后的实体数组 */
  translations: Record<string, Entity[] | null>
  /** 状态：推文ID -> 显示状态 */
  translationVisibility: Record<string, { body: boolean, alt: boolean }>
  /** 覆盖：推文ID -> 独立翻译模式 */
  tweetTranslationModes: Record<string, TranslationMode>
}

interface DataActions {
  setAllTweets: (data: TweetData, mainTweetId: string) => void
  appendTweets: (data: TweetData) => void

  setCommentsCount: (count: number) => void

  // Translation CRUD
  setTranslation: (tweetId: string, content: Entity[] | null) => void
  getTranslation: (tweetId: string) => Entity[] | null | undefined
  deleteTranslation: (tweetId: string) => void
  resetTranslation: (tweetId: string) => void

  // Visibility & Mode
  getTranslationVisibility: (tweetId: string) => { body: boolean, alt: boolean }
  setTranslationVisibility: (tweetId: string, visibility: Partial<{ body: boolean, alt: boolean }>) => void
  setTweetTranslationMode: (tweetId: string, mode: TranslationMode) => void
  getTweetTranslationMode: (tweetId: string) => TranslationMode
}

/**
 * 3. UI Domain
 * 负责交互状态、选区、截图等临时状态
 */
interface UIState {
  translationMode: TranslationMode
  showTranslationButton: boolean
  editingTweetId: string | null
  tweetElRef: HTMLDivElement | null
  screenshoting: boolean
  isSelectionMode: boolean
  selectedTweetIds: string[]
  isCapturingSelected: boolean
}

interface UIActions {
  setTranslationMode: (mode: TranslationMode) => void
  setShowTranslationButton: (show: boolean) => void
  setEditingTweetId: (tweetId: string | null) => void
  setTweetElRef: (ref: HTMLDivElement) => void
  setScreenshoting: (screenshoting: boolean) => void

  // Selection Logic
  toggleSelectionMode: (enabled?: boolean) => void
  toggleTweetSelection: (tweetId: string) => void
  selectAllTweets: (selected?: boolean) => void
  setIsCapturingSelected: (isCapturing: boolean) => void
}

/**
 * Utility Domain
 * 辅助工具方法
 */
interface Utils {
  hasTextContent: (text?: string) => boolean
}

// 合并所有类型
type TranslationState = SettingsState & DataState & UIState
type TranslationActions = SettingsActions & DataActions & UIActions & Utils

export type TranslationStore = TranslationState & TranslationActions

const DEFAULT_SETTINGS: SettingsState['settings'] = {
  enabled: true,
  customSeparator: DEFAULT_TEMPLATES[0]!.html,
  selectedTemplateId: DEFAULT_TEMPLATES[0]!.id,
  separatorTemplates: DEFAULT_TEMPLATES,
  customTemplates: [],
}

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get) => ({

      // Settings
      settings: DEFAULT_SETTINGS,

      // Data
      tweets: [],
      mainTweet: null,
      commentsCount: 0,
      translations: {},
      translationVisibility: {},
      tweetTranslationModes: {},

      // UI
      translationMode: 'bilingual',
      showTranslationButton: true,
      editingTweetId: null,
      tweetElRef: null,
      screenshoting: false,
      isSelectionMode: false,
      selectedTweetIds: [],
      isCapturingSelected: false,

      setCommentsCount: (count: number) =>
        set(state => ({
          ...state,
          commentsCount: count,
        })),

      updateSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: { ...DEFAULT_SETTINGS } }),

      selectTemplate: templateId =>
        set((state) => {
          const { separatorTemplates, customTemplates } = state.settings
          const template = separatorTemplates.find(t => t.id === templateId)
            || customTemplates.find(t => t.id === templateId)

          if (!template)
            return state

          return {
            settings: {
              ...state.settings,
              selectedTemplateId: templateId,
              customSeparator: template.html,
            },
          }
        }),

      updateTemplate: (templateId, updates) =>
        set(state => ({
          settings: {
            ...state.settings,
            separatorTemplates: state.settings.separatorTemplates.map(t =>
              t.id === templateId ? { ...t, ...updates } : t,
            ),
          },
        })),

      addTemplate: template =>
        set(state => ({
          settings: {
            ...state.settings,
            separatorTemplates: [
              ...state.settings.separatorTemplates,
              { ...template, id: `custom-${Date.now()}` },
            ],
          },
        })),

      deleteTemplate: templateId =>
        set(state => ({
          settings: {
            ...state.settings,
            separatorTemplates: state.settings.separatorTemplates.filter(t => t.id !== templateId),
            selectedTemplateId: state.settings.selectedTemplateId === templateId
              ? 'preset-google'
              : state.settings.selectedTemplateId,
          },
        })),

      addCustomTemplate: (template) => {
        const newId = `custom-${Date.now()}`
        set(state => ({
          settings: {
            ...state.settings,
            customTemplates: [...state.settings.customTemplates, { ...template, id: newId }],
          },
        }))
        return newId
      },

      updateCustomTemplate: (templateId, updates) =>
        set(state => ({
          settings: {
            ...state.settings,
            customTemplates: state.settings.customTemplates.map(t =>
              t.id === templateId ? { ...t, ...updates } : t,
            ),
          },
        })),

      deleteCustomTemplate: templateId =>
        set((state) => {
          const newCustomTemplates = state.settings.customTemplates.filter(t => t.id !== templateId)

          let { selectedTemplateId, customSeparator } = state.settings

          // 如果删除了当前选中的，智能回退
          if (selectedTemplateId === templateId) {
            const fallback = state.settings.separatorTemplates[0] || newCustomTemplates[0]
            selectedTemplateId = fallback?.id || 'preset-google'
            customSeparator = fallback?.html || ''
          }

          return {
            settings: {
              ...state.settings,
              customTemplates: newCustomTemplates,
              selectedTemplateId,
              customSeparator,
            },
          }
        }),

      setAllTweets: (data, mainTweetId) => {
        const extracted = extractTranslationsFromEntities(data)
        set(state => ({
          tweets: data,
          mainTweet: data.find(t => t.id_str === mainTweetId) || null,
          translations: { ...state.translations, ...extracted },
        }))
      },

      appendTweets: (data) => {
        const state = get()
        const existingIds = new Set(state.tweets.map(t => t.id_str))
        const newTweets = data.filter(t => !existingIds.has(t.id_str))

        if (newTweets.length === 0)
          return

        const extracted = extractTranslationsFromEntities(newTweets)
        set(state => ({
          tweets: [...state.tweets, ...newTweets],
          translations: { ...state.translations, ...extracted },
        }))
      },

      setTranslation: (tweetId, content) =>
        set((state) => {
          // Case: 隐藏翻译 (content 为 null)
          if (content === null) {
            return {
              translations: { ...state.translations, [tweetId]: null },
            }
          }

          // Case: 更新翻译
          // 这里的副作用是同步更新 tweets 数组中的 entities，保持 UI 数据源一致
          const updateTweetEntities = (t: EnrichedTweet): EnrichedTweet =>
            t.id_str === tweetId ? { ...t, entities: content } : t

          return {
            translations: { ...state.translations, [tweetId]: content },
            tweets: state.tweets.map((tweet) => {
              if (tweet.quotedTweet) {
                tweet.quotedTweet = updateTweetEntities(tweet.quotedTweet)
              }
              return updateTweetEntities(tweet)
            }),
            mainTweet: state.mainTweet ? updateTweetEntities(state.mainTweet) : null,
          }
        }),

      getTranslation: tweetId => get().translations[tweetId],

      getTranslationVisibility: tweetId =>
        get().translationVisibility[tweetId] || { body: true, alt: true },

      setTranslationVisibility: (tweetId, visibility) =>
        set((state) => {
          const current = state.translationVisibility[tweetId] || { body: true, alt: true }
          return {
            translationVisibility: {
              ...state.translationVisibility,
              [tweetId]: { ...current, ...visibility },
            },
          }
        }),

      resetTranslation: tweetId =>
        get().setTranslationVisibility(tweetId, { body: false, alt: false }),

      deleteTranslation: tweetId =>
        set((state) => {
          const { [tweetId]: _, ...newTranslations } = state.translations
          const { [tweetId]: __, ...newVisibility } = state.translationVisibility
          return {
            translations: newTranslations,
            translationVisibility: newVisibility,
          }
        }),

      setTweetTranslationMode: (tweetId, mode) =>
        set(state => ({
          tweetTranslationModes: { ...state.tweetTranslationModes, [tweetId]: mode },
        })),

      getTweetTranslationMode: (tweetId) => {
        const state = get()
        return state.tweetTranslationModes[tweetId] || state.translationMode
      },

      setTranslationMode: mode =>
        set({
          translationMode: mode,
          tweetTranslationModes: {}, // 切换全局模式时，重置所有单独覆盖配置
        }),

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
            // 退出模式时清空选择，进入模式时保留当前选择(或空)
            selectedTweetIds: nextMode ? state.selectedTweetIds : [],
            isCapturingSelected: false,
          }
        }),

      toggleTweetSelection: (tweetId) => {
        const state = get()
        const isCurrentlySelected = state.selectedTweetIds.includes(tweetId)
        const shouldSelect = !isCurrentlySelected

        // 构建所有可用推文的扁平列表
        const allTweets = [
          ...(state.mainTweet ? [state.mainTweet] : []),
          ...state.tweets,
        ]

        // 逻辑变更：
        // 1. 如果点击的是主推文：仅选中/取消选中它自己 (不传递给子节点)
        // 2. 如果点击的是评论/回复：保持原有逻辑，选中它及其所有后代
        let targetIds: string[] = [tweetId] // 默认只包含自己

        const isMainTweet = state.mainTweet && state.mainTweet.id_str === tweetId

        if (!isMainTweet) {
          // 如果不是主推文，则递归查找所有回复链
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

      selectAllTweets: (selected = true) =>
        set((state) => {
          if (!selected)
            return { selectedTweetIds: [] }

          const allIds = [
            ...(state.mainTweet ? [state.mainTweet.id_str] : []),
            ...state.tweets.map(t => t.id_str),
          ]
          return { selectedTweetIds: allIds }
        }),

      hasTextContent: checkTextContent,
    }),

    {
      name: 'translation-store',
      version: 4,
      // 持久化白名单：仅保存设置和全局模式，不保存推文数据和临时UI状态
      partialize: state => ({
        settings: state.settings,
        translationMode: state.translationMode,
      }),
      migrate: (state: any, version) => {
        // v2: 增加 Gemini 模板
        if (version === 2) {
          state.settings.separatorTemplates.push({
            id: 'preset-gemini',
            name: 'Gemini 翻译风格',
            html: `<div style="margin-top: 4px; color: #3285FD;">
  <b style="font-weight: bold; font-size: small;">由 Gemini 3 Flash 翻译自日语</b>
  <hr style="margin: 3px; border-top-width: 2px;">
</div>`,
          })
        }
        // v4: 迁移 showTranslations -> translationMode
        if (version < 4) {
          if (state && typeof state.showTranslations === 'boolean') {
            state.translationMode = state.showTranslations ? 'bilingual' : 'original'
            delete state.showTranslations
          }
          else if (state && !state.translationMode) {
            state.translationMode = 'bilingual'
          }
        }
        return state
      },
    },
  ),
)
