import type { EnrichedTweet, Entity } from '~/lib/react-tweet'
import type { TweetData } from '~/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { flatTweets } from '../utils'

interface SeparatorTemplate {
  id: string
  name: string
  html: string
}

interface TranslationSettings {
  enabled: boolean
  customSeparator: string
  selectedTemplateId: string
  separatorTemplates: SeparatorTemplate[]
  customTemplates: SeparatorTemplate[]
}

interface TranslationState {
  // === Data Domain ===
  tweets: TweetData
  mainTweet: EnrichedTweet | null
  /** 存储推文ID到实体数组的映射，用于缓存翻译结果 */
  translations: Record<string, Entity[]>

  // === Settings Domain ===
  settings: TranslationSettings

  // === UI Domain ===
  showTranslations: boolean
  showTranslationButton: boolean
  editingTweetId: string | null
  tweetElRef: HTMLDivElement | null
  screenshoting: boolean

  // === Actions: Settings ===
  updateSettings: (settings: Partial<TranslationSettings>) => void
  resetSettings: () => void
  selectTemplate: (templateId: string) => void
  updateTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  addTemplate: (template: Omit<SeparatorTemplate, 'id'>) => void
  deleteTemplate: (templateId: string) => void
  addCustomTemplate: (template: Omit<SeparatorTemplate, 'id'>) => string
  updateCustomTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  deleteCustomTemplate: (templateId: string) => void

  // === Actions: Data ===
  setTranslation: (tweetId: string, content: Entity[]) => void
  getTranslation: (tweetId: string) => Entity[] | undefined
  deleteTranslation: (tweetId: string) => void
  setAllTweets: (data: TweetData, mainTweetId: string) => void

  // === Actions: UI ===
  setShowTranslations: (show: boolean) => void
  setScreenshoting: (screenshoting: boolean) => void
  setEditingTweetId: (tweetId: string | null) => void
  setShowTranslationButton: (show: boolean) => void
  setTweetElRef: (ref: HTMLDivElement) => void

  // === Utils ===
  hasTextContent: (text?: string) => boolean
}

const DEFAULT_TEMPLATES: SeparatorTemplate[] = [
  {
    id: 'preset-google',
    name: '谷歌翻译风格',
    html: `<div style="margin-top: 4px; color: #1d9bf0;">
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译自 日语</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`,
  },
]

const DEFAULT_SETTINGS: TranslationSettings = {
  enabled: true,
  customSeparator: DEFAULT_TEMPLATES[0]!.html,
  selectedTemplateId: DEFAULT_TEMPLATES[0]!.id,
  separatorTemplates: DEFAULT_TEMPLATES,
  customTemplates: [],
}

/**
 * 业务逻辑提取：检查文本有效性
 * 避免在 Store 中包含过多的正则闭包
 */
function checkTextContent(text?: string): boolean {
  if (!text)
    return false
  const cleanText = text.trim()
  if (cleanText.length === 0)
    return false

  // 移除链接、提及、标签，检查是否还有剩余文本
  const contentWithoutMeta = cleanText
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#\w+/g, '')
    .trim()

  return contentWithoutMeta.length > 0
}

/**
 * 核心业务逻辑：从推文中提取已存在的翻译
 * 规则：如果 entities 数组中任意一个元素包含 translation 字段，
 * 则认为该 entities 数组携带了翻译信息。
 */
function extractTranslationsFromEntities(tweets: EnrichedTweet | EnrichedTweet[]): Record<string, Entity[]> {
  const list = flatTweets(Array.isArray(tweets) ? tweets : [tweets])
  const extracted: Record<string, Entity[]> = {}

  for (const tweet of list) {
    if (!tweet.entities || tweet.entities.length === 0)
      continue

    // 检查 entities 中是否存在 translation 字段
    // 只要有一个 entity 有 translation，我们就认为这个数组是处理过的（或者部分处理过的）
    // 并将其作为该 tweet 的翻译缓存起来
    const hasTranslation = tweet.entities.some(entity =>
      typeof entity.translation === 'string' && entity.translation?.trim(),
    )

    if (hasTranslation) {
      extracted[tweet.id_str] = tweet.entities
    }
  }

  return extracted
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      // --- Initial State ---
      settings: DEFAULT_SETTINGS,
      translations: {},
      tweets: [],
      mainTweet: null,

      // UI Defaults
      showTranslations: false,
      showTranslationButton: false,
      editingTweetId: null,
      tweetElRef: null,
      screenshoting: false,

      updateSettings: newSettings =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: { ...DEFAULT_SETTINGS } }),

      selectTemplate: templateId =>
        set((state) => {
          const { separatorTemplates, customTemplates } = state.settings
          // 统一查找逻辑
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
            // 防御性编程：如果删除了当前选中的，回退到默认
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

          // 智能回退逻辑：如果删除了当前选中的，尝试回退到第一个自定义或默认模板
          let { selectedTemplateId, customSeparator } = state.settings
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
          mainTweet: data.find(t => t.id_str === mainTweetId),
          translations: {
            ...state.translations,
            ...extracted,
          },
        }))
      },

      setTranslation: (tweetId, content) =>
        set((state) => {
          // 保持数据一致性：更新 Map 同时更新 Tweet 对象内的 entities
          // 这是一个副作用处理：确保 UI 渲染源（tweets数组）和缓存源（translations字典）同步
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

      deleteTranslation: tweetId =>
        set((state) => {
          const newTranslations = { ...state.translations }
          delete newTranslations[tweetId]
          return { translations: newTranslations }
        }),

      setShowTranslations: show => set({ showTranslations: show }),
      setShowTranslationButton: show => set({ showTranslationButton: show }),
      setEditingTweetId: tweetId => set({ editingTweetId: tweetId }),
      setTweetElRef: ref => set({ tweetElRef: ref }),
      setScreenshoting: screenshoting => set({ screenshoting }),

      hasTextContent: checkTextContent,
    }),
    {
      name: 'translation-store',
      version: 2,
      // 持久化白名单：只持久化设置，不持久化推文数据和UI状态
      partialize: state => ({
        settings: state.settings,
      }),
    },
  ),
)
