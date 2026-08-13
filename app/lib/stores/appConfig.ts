import { useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ScreenshotFormat = 'png' | 'jpeg'
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'
export type AIProvider = 'google' | 'deepseek' | 'openrouter'

export interface AppConfigs {
  theme: Theme
  screenshotFormat: ScreenshotFormat
  showActions: boolean
  enableMediaProxy: boolean
  mediaProxyUrl: string
  enableAITranslation: boolean
  aiProvider: AIProvider
  geminiApiKey: string
  geminiModel: string
  geminiBaseUrl: string
  geminiThinkingLevel: ThinkingLevel
  deepseekApiKey: string
  deepseekModel: string
  deepseekBaseUrl: string
  deepseekThinkingLevel: ThinkingLevel
  openrouterApiKey: string
  openrouterModel: string
  openrouterBaseUrl: string
  openrouterThinkingLevel: ThinkingLevel
  translationGlossary: string
  enableAIVision: boolean
  /** 视觉 provider：只允许支持图片输入的（google / openrouter），复用翻译侧对应 key */
  visionProvider: AIProvider
  /** 仅显示译文：AIVisionBlock 展示开关（隐藏 OCR 原文） */
  visionShowTranslatedOnly: boolean
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
  setAIProvider: (provider: AIProvider) => void
  setGeminiApiKey: (apiKey: string) => void
  setGeminiModel: (model: string) => void
  setGeminiBaseUrl: (baseUrl: string) => void
  setGeminiThinkingLevel: (level: ThinkingLevel) => void
  setDeepseekApiKey: (apiKey: string) => void
  setDeepseekModel: (model: string) => void
  setDeepseekBaseUrl: (baseUrl: string) => void
  setDeepseekThinkingLevel: (level: ThinkingLevel) => void
  setOpenrouterApiKey: (apiKey: string) => void
  setOpenrouterModel: (model: string) => void
  setOpenrouterBaseUrl: (baseUrl: string) => void
  setOpenrouterThinkingLevel: (level: ThinkingLevel) => void
  setTranslationGlossary: (glossary: string) => void
  setEnableAIVision: (enable: boolean) => void
  setVisionProvider: (provider: AIProvider) => void
  setVisionShowTranslatedOnly: (show: boolean) => void
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
      aiProvider: 'google',
      geminiApiKey: '',
      geminiModel: 'models/gemini-3-flash-preview',
      geminiBaseUrl: '',
      geminiThinkingLevel: 'minimal',
      deepseekApiKey: '',
      deepseekModel: 'deepseek-v4-flash',
      deepseekBaseUrl: '',
      deepseekThinkingLevel: 'high',
      openrouterApiKey: '',
      openrouterModel: 'xiaomi/mimo-v2.5',
      openrouterBaseUrl: '',
      openrouterThinkingLevel: 'minimal',
      translationGlossary: '',
      enableAIVision: false,
      visionProvider: 'google',
      visionShowTranslatedOnly: false,
      isInlineMedia: false,

      setEnableMediaProxy: enableMediaProxy => set({ enableMediaProxy }),
      setMediaProxyUrl: mediaProxyUrl => set({ mediaProxyUrl }),
      setEnableAITranslation: enableAITranslation => set({ enableAITranslation }),
      setAIProvider: aiProvider => set({ aiProvider }),
      setTheme: theme => set({ theme }),
      setScreenshotFormat: screenshotFormat => set({ screenshotFormat }),
      setShowActions: showActions => set({ showActions }),
      setGeminiApiKey: geminiApiKey => set({ geminiApiKey }),
      setGeminiModel: geminiModel => set({ geminiModel }),
      setGeminiBaseUrl: geminiBaseUrl => set({ geminiBaseUrl }),
      setGeminiThinkingLevel: geminiThinkingLevel => set({ geminiThinkingLevel }),
      setDeepseekApiKey: deepseekApiKey => set({ deepseekApiKey }),
      setDeepseekModel: deepseekModel => set({ deepseekModel }),
      setDeepseekBaseUrl: deepseekBaseUrl => set({ deepseekBaseUrl }),
      setDeepseekThinkingLevel: deepseekThinkingLevel => set({ deepseekThinkingLevel }),
      setOpenrouterApiKey: openrouterApiKey => set({ openrouterApiKey }),
      setOpenrouterModel: openrouterModel => set({ openrouterModel }),
      setOpenrouterBaseUrl: openrouterBaseUrl => set({ openrouterBaseUrl }),
      setOpenrouterThinkingLevel: openrouterThinkingLevel => set({ openrouterThinkingLevel }),
      setTranslationGlossary: translationGlossary => set({ translationGlossary }),
      setEnableAIVision: enableAIVision => set({ enableAIVision }),
      setVisionProvider: visionProvider => set({ visionProvider }),
      setVisionShowTranslatedOnly: visionShowTranslatedOnly => set({ visionShowTranslatedOnly }),
      setIsInlineMedia: isInlineMedia => set({ isInlineMedia }),
    }),
    {
      name: 'app-config-store',
      version: 4,
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
