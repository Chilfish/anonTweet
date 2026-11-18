import { useCallback } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type ScreenshotFormat = 'png' | 'jpeg'
export type DownloadImageSize = 'large' | 'orig'
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'
export type AIProvider = 'google' | 'deepseek' | 'openrouter'
/**
 * AI 请求路径：
 * - `server`（默认）：经本站 /api/ai-* 的 CF Worker 中继（带超时、白名单与缓存写入）
 * - `browser`：浏览器直接请求模型服务商（需服务商支持 CORS；Key 不再经过本站服务器）
 */
export type AIRequestMode = 'server' | 'browser'

export interface AppConfigs {
  theme: Theme
  screenshotFormat: ScreenshotFormat
  /** 下载推文图片时请求的分辨率：large = 2048px JPG；orig = 原始最大分辨率 */
  downloadImageSize: DownloadImageSize
  /** 下载媒体时是否一并下载链接卡片的图片 */
  downloadCardImages: boolean
  showActions: boolean
  enableMediaProxy: boolean
  mediaProxyUrl: string
  enableAITranslation: boolean
  aiProvider: AIProvider
  /** AI 请求路径：服务端中继（默认）或浏览器直连 */
  aiRequestMode: AIRequestMode
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
  /** 视觉 provider：支持图片输入的（google / deepseek / openrouter），复用翻译侧对应 key */
  visionProvider: AIProvider
  /** 仅显示译文：AIVisionBlock 展示开关（隐藏 OCR 原文） */
  visionShowTranslatedOnly: boolean
  /** 翻译按钮旁「添加图片描述」入口（较少使用，默认关闭） */
  showVisionEntry: boolean
  isInlineMedia: boolean
}

interface AppConfigState extends AppConfigs {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  setTheme: (theme: Theme) => void
  setScreenshotFormat: (format: ScreenshotFormat) => void
  setDownloadImageSize: (size: DownloadImageSize) => void
  setDownloadCardImages: (include: boolean) => void
  setShowActions: (showActions: boolean) => void

  setEnableMediaProxy: (enableMediaProxy: boolean) => void
  setMediaProxyUrl: (mediaProxyUrl: string) => void
  setEnableAITranslation: (enable: boolean) => void
  setAIProvider: (provider: AIProvider) => void
  setAIRequestMode: (mode: AIRequestMode) => void
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
  setShowVisionEntry: (show: boolean) => void
  setIsInlineMedia: (isInlineMedia: boolean) => void
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    set => ({
      _hasHydrated: false,
      setHasHydrated: state => set({ _hasHydrated: state }),

      theme: 'light',
      screenshotFormat: 'jpeg',
      downloadImageSize: 'orig',
      downloadCardImages: true,
      showActions: false,
      enableMediaProxy: false,
      mediaProxyUrl: 'https://proxy.chilfish.top/',
      enableAITranslation: false,
      // 默认引擎：DeepSeek Flash（官方别名，当前由 DeepSeek-V4.1-Flash 提供，
      // 1M 上下文，同时支持文本与图片输入，见 app/lib/constants.ts）
      aiProvider: 'deepseek',
      aiRequestMode: 'server',
      geminiApiKey: '',
      geminiModel: 'models/gemini-3-flash-preview',
      geminiBaseUrl: '',
      geminiThinkingLevel: 'minimal',
      deepseekApiKey: '',
      deepseekModel: 'deepseek-flash',
      deepseekBaseUrl: '',
      // 翻译/识图属于短文本结构化任务，DeepSeek 官方建议关闭思考：
      // 更低延迟与成本，temperature 才生效，也减少 JSON 模式下的空输出/重试。
      // 需要更强推理时用户可自行调到 high / max。
      deepseekThinkingLevel: 'minimal',
      openrouterApiKey: '',
      openrouterModel: 'xiaomi/mimo-v2.5',
      openrouterBaseUrl: '',
      openrouterThinkingLevel: 'minimal',
      translationGlossary: '',
      enableAIVision: false,
      // 视觉默认同样走 DeepSeek Flash（deepseek-flash 支持图片输入）
      visionProvider: 'deepseek',
      visionShowTranslatedOnly: true,
      showVisionEntry: false,
      isInlineMedia: false,

      setEnableMediaProxy: enableMediaProxy => set({ enableMediaProxy }),
      setMediaProxyUrl: mediaProxyUrl => set({ mediaProxyUrl }),
      setEnableAITranslation: enableAITranslation => set({ enableAITranslation }),
      setAIProvider: aiProvider => set({ aiProvider }),
      setAIRequestMode: aiRequestMode => set({ aiRequestMode }),
      setTheme: theme => set({ theme }),
      setScreenshotFormat: screenshotFormat => set({ screenshotFormat }),
      setDownloadImageSize: downloadImageSize => set({ downloadImageSize }),
      setDownloadCardImages: downloadCardImages => set({ downloadCardImages }),
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
      setShowVisionEntry: showVisionEntry => set({ showVisionEntry }),
      setIsInlineMedia: isInlineMedia => set({ isInlineMedia }),
    }),
    {
      name: 'app-config-store',
      version: 8,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<AppConfigs>
        let next = state
        // v4 → v5：AI 图片描述默认仅显示译文（保留其余设置）
        if (version < 5) {
          next = { ...next, visionShowTranslatedOnly: true }
        }
        // v5 → v6：DeepSeek 模型 slug 对齐官方文档（旧名 deepseek-v4-flash / deepseek v4 pro 已退役）
        if (version < 6) {
          if (next.deepseekModel === 'deepseek-v4-flash') {
            next = { ...next, deepseekModel: 'deepseek-flash' }
          }
          else if (next.deepseekModel === 'deepseek v4 pro') {
            next = { ...next, deepseekModel: 'deepseek-v4-pro' }
          }
        }
        // v6 → v7：默认引擎切到 DeepSeek Flash。仅当原选择是 Google 且没配 Gemini Key
        // 时改写，避免把已配置 Gemini 的用户强行切到没有 Key 的 DeepSeek。
        if (version < 7) {
          if (!next.geminiApiKey) {
            if (!next.aiProvider || next.aiProvider === 'google')
              next = { ...next, aiProvider: 'deepseek' }
            if (!next.visionProvider || next.visionProvider === 'google')
              next = { ...next, visionProvider: 'deepseek' }
          }
          if (!next.deepseekModel)
            next = { ...next, deepseekModel: 'deepseek-flash' }
        }
        // v7 → v8：默认保持服务端中继（CF Worker）；浏览器直连由用户显式开启
        if (version < 8) {
          next = { ...next, aiRequestMode: 'server' }
        }
        return next
      },
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
