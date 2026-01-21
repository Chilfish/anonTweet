import { useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ScreenshotFormat = 'png' | 'jpeg'
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high'

export interface AppConfigs {
  theme: Theme
  screenshotFormat: ScreenshotFormat
  showActions: boolean
  enableMediaProxy: boolean
  mediaProxyUrl: string
  enableAITranslation: boolean
  geminiApiKey: string
  geminiModel: string
  geminiThinkingLevel: ThinkingLevel
  translationGlossary: string
  isInlineMedia: boolean
}

interface AppConfigState extends AppConfigs {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  setTheme: (theme: Theme) => void
  setScreenshotFormat: (format: ScreenshotFormat) => void
  setShowActions: (showActions: boolean) => void

  setEnableMediaProxy: (enableMediaProxy: boolean) => void
  setMediaProxyUrl: (mediaProxyUrl: string) => void
  setEnableAITranslation: (enable: boolean) => void
  setGeminiApiKey: (apiKey: string) => void
  setGeminiModel: (model: string) => void
  setGeminiThinkingLevel: (level: ThinkingLevel) => void
  setTranslationGlossary: (glossary: string) => void
  setIsInlineMedia: (isInlineMedia: boolean) => void
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    set => ({
      _hasHydrated: false,
      setHasHydrated: state => set({ _hasHydrated: state }),

      theme: 'light',
      screenshotFormat: 'jpeg',
      showActions: false,
      enableMediaProxy: false,
      mediaProxyUrl: 'https://proxy.chilfish.top/',
      enableAITranslation: false,
      geminiApiKey: '',
      geminiModel: 'models/gemini-3-flash-preview',
      geminiThinkingLevel: 'minimal',
      translationGlossary: '',
      isInlineMedia: false,

      setEnableMediaProxy: enableMediaProxy => set({ enableMediaProxy }),
      setMediaProxyUrl: mediaProxyUrl => set({ mediaProxyUrl }),
      setEnableAITranslation: enableAITranslation => set({ enableAITranslation }),
      setTheme: theme => set({ theme }),
      setScreenshotFormat: screenshotFormat => set({ screenshotFormat }),
      setShowActions: showActions => set({ showActions }),
      setGeminiApiKey: geminiApiKey => set({ geminiApiKey }),
      setGeminiModel: geminiModel => set({ geminiModel }),
      setGeminiThinkingLevel: geminiThinkingLevel => set({ geminiThinkingLevel }),
      setTranslationGlossary: translationGlossary => set({ translationGlossary }),
      setIsInlineMedia: isInlineMedia => set({ isInlineMedia }),
    }),
    {
      name: 'app-config-store',
      version: 2,
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true)
      },
    },
  ),
)

export function useProxyMedia() {
  const enableMediaProxy = useAppConfigStore(s => s.enableMediaProxy)
  const mediaProxyUrl = useAppConfigStore(s => s.mediaProxyUrl)

  return useCallback((url: string, force?: boolean) => {
    if (!url)
      return ''
    if (url.startsWith(mediaProxyUrl))
      return url
    if (enableMediaProxy || force)
      return `${mediaProxyUrl}${url}`
    return url
  }, [enableMediaProxy, mediaProxyUrl])
}
