import type { StateCreator } from 'zustand'
import type { SeparatorTemplate } from '~/lib/constants'
import type { EnrichedTweet, Entity, TweetData } from '~/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_TEMPLATES } from '~/lib/constants'
import { checkTextContent, extractTranslationsFromEntities } from './logic'

export type TranslationMode = 'bilingual' | 'original' | 'translation'

const DEFAULT_VISIBILITY = { body: true, alt: true }

// --- Settings Slice ---

interface SettingsState {
  enabled: boolean
  customSeparator: string
  selectedTemplateId: string
  filterUnrelated: boolean
  separatorTemplates: SeparatorTemplate[]
  customTemplates: SeparatorTemplate[]
}

const DEFAULT_SETTINGS: SettingsState = {
  enabled: true,
  customSeparator: DEFAULT_TEMPLATES[0]!.html,
  selectedTemplateId: DEFAULT_TEMPLATES[0]!.id,
  filterUnrelated: false,
  separatorTemplates: DEFAULT_TEMPLATES,
  customTemplates: [],
}

interface SettingsSlice {
  settings: SettingsState
  updateSettings: (settings: Partial<SettingsState>) => void
  resetSettings: () => void
  selectTemplate: (templateId: string) => void
  updateTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  addTemplate: (template: Omit<SeparatorTemplate, 'id'>) => void
  deleteTemplate: (templateId: string) => void
  addCustomTemplate: (template: Omit<SeparatorTemplate, 'id'>) => string
  updateCustomTemplate: (templateId: string, updates: Partial<SeparatorTemplate>) => void
  deleteCustomTemplate: (templateId: string) => void
}

const createSettingsSlice: StateCreator<
  TranslationStore,
  [],
  [],
  SettingsSlice
> = set => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: newSettings =>
    set(state => ({ settings: { ...state.settings, ...newSettings } })),

  resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

  selectTemplate: templateId =>
    set((state) => {
      const { separatorTemplates, customTemplates } = state.settings
      const template
        = separatorTemplates.find(t => t.id === templateId)
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
        selectedTemplateId:
          state.settings.selectedTemplateId === templateId
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
})

// --- Data Slice ---

interface DataSlice {
  tweets: TweetData
  mainTweet: EnrichedTweet | null
  commentIds: string[]
  translations: Record<string, Entity[] | null>
  translationVisibility: Record<string, { body: boolean, alt: boolean }>
  tweetTranslationModes: Record<string, TranslationMode>
  translationMode: TranslationMode

  // Data Actions
  setAllTweets: (data: TweetData, mainTweetId: string) => void
  appendTweets: (data: TweetData) => void
  setCommentIds: (ids: string[]) => void
  setTranslation: (tweetId: string, content: Entity[] | null) => void
  getTranslation: (tweetId: string) => Entity[] | null | undefined
  deleteTranslation: (tweetId: string) => void
  resetTranslation: (tweetId: string) => void
  getTranslationVisibility: (tweetId: string) => { body: boolean, alt: boolean }
  setTranslationVisibility: (tweetId: string, visibility: Partial<{ body: boolean, alt: boolean }>) => void
  setTweetTranslationMode: (tweetId: string, mode: TranslationMode) => void
  getTweetTranslationMode: (tweetId: string) => TranslationMode
  setTranslationMode: (mode: TranslationMode) => void

  // Utils
  hasTextContent: (text?: string) => boolean
}

const createDataSlice: StateCreator<
  TranslationStore,
  [],
  [],
  DataSlice
> = (set, get) => ({
  // --- State ---
  tweets: [],
  mainTweet: null,
  commentIds: [],
  translations: {},
  translationVisibility: {},
  tweetTranslationModes: {},
  translationMode: 'bilingual',

  // --- Actions ---
  setCommentIds: ids => set({ commentIds: ids }),

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
      if (content === null) {
        return { translations: { ...state.translations, [tweetId]: null } }
      }
      const updateTweetEntities = (t: EnrichedTweet): EnrichedTweet =>
        t.id_str === tweetId ? { ...t, entities: content } : t

      return {
        translations: { ...state.translations, [tweetId]: content },
        tweets: state.tweets.map((tweet) => {
          if (tweet.quotedTweet)
            tweet.quotedTweet = updateTweetEntities(tweet.quotedTweet)
          return updateTweetEntities(tweet)
        }),
        mainTweet: state.mainTweet ? updateTweetEntities(state.mainTweet) : null,
      }
    }),

  getTranslation: tweetId => get().translations[tweetId],

  getTranslationVisibility: tweetId =>
    get().translationVisibility[tweetId] || DEFAULT_VISIBILITY,

  setTranslationVisibility: (tweetId, visibility) =>
    set((state) => {
      const current = state.translationVisibility[tweetId] || DEFAULT_VISIBILITY
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
      tweetTranslationModes: {},
    }),

  hasTextContent: checkTextContent,
})

interface HydrationSlice {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export type TranslationStore = SettingsSlice & DataSlice & HydrationSlice

export const useTranslationStore = create<TranslationStore>()(
  persist(
    (set, get, store) => ({
      ...createSettingsSlice(set, get, store),
      ...createDataSlice(set, get, store),
      _hasHydrated: false,
      setHasHydrated: state => set({ _hasHydrated: state }),
    }),
    {
      name: 'translation-store',
      partialize: state => ({
        settings: state.settings,
        translationMode: state.translationMode,
      }),
      version: 5,
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true)
      },
    },
  ),
)
