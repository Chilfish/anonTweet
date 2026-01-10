import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ScreenshotFormat = 'png' | 'jpeg'

export interface AppConfigs {
  theme: Theme
  screenshotFormat: ScreenshotFormat
  showActions: boolean
  enableMediaProxy: boolean
  mediaProxyUrl: string
  enableAITranslation: boolean
  geminiApiKey: string
  geminiModel: string
  translationGlossary: string
}

interface AppConfigState extends AppConfigs {
  setTheme: (theme: Theme) => void
  setScreenshotFormat: (format: ScreenshotFormat) => void
  setShowActions: (showActions: boolean) => void

  setEnableMediaProxy: (enableMediaProxy: boolean) => void
  setMediaProxyUrl: (mediaProxyUrl: string) => void
  setEnableAITranslation: (enable: boolean) => void
  setGeminiApiKey: (apiKey: string) => void
  setGeminiModel: (model: string) => void
  setTranslationGlossary: (glossary: string) => void
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    set => ({
      theme: 'light',
      screenshotFormat: 'jpeg',
      showActions: false,
      enableMediaProxy: false,
      mediaProxyUrl: 'https://proxy.chilfish.top/',
      enableAITranslation: false,
      geminiApiKey: '',
      geminiModel: 'models/gemini-3-flash-preview',
      translationGlossary: '',

      setEnableMediaProxy: enableMediaProxy => set({ enableMediaProxy }),
      setMediaProxyUrl: mediaProxyUrl => set({ mediaProxyUrl }),
      setEnableAITranslation: enableAITranslation => set({ enableAITranslation }),
      setTheme: theme => set({ theme }),
      setScreenshotFormat: screenshotFormat => set({ screenshotFormat }),
      setShowActions: showActions => set({ showActions }),
      setGeminiApiKey: geminiApiKey => set({ geminiApiKey }),
      setGeminiModel: geminiModel => set({ geminiModel }),
      setTranslationGlossary: translationGlossary => set({ translationGlossary }),
    }),
    {
      name: 'app-config-store',
      version: 2,
    },
  ),
)

export function useProxyMedia() {
  const enableMediaProxy = useAppConfigStore(s => s.enableMediaProxy)
  const mediaProxyUrl = useAppConfigStore(s => s.mediaProxyUrl)

  return (url: string, force?: boolean) => {
    if (url?.startsWith(mediaProxyUrl))
      return url

    if (enableMediaProxy || force)
      return `${mediaProxyUrl}${url}`
    return url
  }
}
