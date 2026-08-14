import type { VisionDraft } from '~/lib/vision/parse'
import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo, VisionMode } from '~/types/vision'
import { useCallback, useState } from 'react'
import { toastAIError } from '~/lib/ai-error-toast'
import { fetcher } from '~/lib/fetcher'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useResolvedAIConfig,
  useResolvedAIVisionConfig,
  useTranslationActions,
} from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { toast } from '~/lib/utils'
import { applyVisionEdits, mergeVisionInfo } from '~/lib/vision/parse'

/**
 * AI 视觉描述 —— 编辑弹窗逻辑（app/hooks/use-vision-logic.ts）
 *
 * 弹窗级状态：mode（describe/ocr/custom）+ withContext + customPrompt 作用于一次
 * AI 生成请求（对齐 POST /api/ai-vision 的生成路径）。
 * 逐图状态：drafts（原文/译文/描述草稿，直接编辑字段）+ visionInfo（AI 结果工作副本，
 * 用于模式/错误展示与保存重建）。翻译走独立步（action: 'translate'，复用翻译侧模型配置，
 * 附推文上下文）——OCR 纯提取、翻译交给翻译模型。
 * Postmortem #002：合并/保存逻辑全部下沉 lib/vision/parse.ts 纯函数。
 */
export function useVisionLogic(originalTweet: EnrichedTweet) {
  const tweetId = originalTweet.id_str
  const photoIndexes = (originalTweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
    .map(x => x.i)

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<VisionMode>('ocr')
  const [customPrompt, setCustomPrompt] = useState('')
  const [withContext, setWithContext] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [visionInfo, setVisionInfo] = useState<AIVisionInfo[]>([])
  const [drafts, setDrafts] = useState<Record<number, VisionDraft>>({})

  const visionConfig = useResolvedAIVisionConfig()
  const translationConfig = useResolvedAIConfig()
  const { updateTweet } = useTranslationActions()
  // 术语表（词典 + 自定义，HIGH 优先级）：与翻译侧同一份，防描述/OCR 翻译对知识库外内容瞎猜
  const dictEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)
  const translationGlossary = useAppConfigStore(state => state.translationGlossary)

  const initializeEditor = useCallback(() => {
    const base = originalTweet.visionInfo ?? []
    setVisionInfo(base)
    setMode(base[0]?.mode ?? 'ocr')
    setCustomPrompt('')
    setWithContext(true)
    setDrafts(
      Object.fromEntries(
        base.map(v => [
          v.index,
          {
            originalText: v.originalText,
            translatedText: v.translatedText,
            description: v.description,
          },
        ]),
      ),
    )
    setIsOpen(true)
  }, [originalTweet.visionInfo])

  /** 生成/翻译结果合并进 drafts，草稿里用户未动的字段保持原值 */
  const syncDraftsFromInfo = useCallback((info: AIVisionInfo[]) => {
    setDrafts((prev) => {
      const next = { ...prev }
      for (const v of info) {
        next[v.index] = {
          ...next[v.index],
          originalText: v.originalText,
          translatedText: v.translatedText,
          description: v.description,
        }
      }
      return next
    })
  }, [])

  const generate = useCallback(async () => {
    const { apiKey, model, provider, baseUrl, thinkingLevel, providerName }
      = visionConfig
    if (!apiKey || !model) {
      toast.error(`请配置 ${providerName} API Key`)
      return
    }
    if (photoIndexes.length === 0)
      return

    setIsGenerating(true)
    try {
      const combinedGlossary = [dictEntries(), translationGlossary].filter(Boolean).join('\n')
      const { data } = await fetcher.post('/api/ai-vision', {
        tweet: originalTweet,
        mediaIndexes: photoIndexes,
        mode,
        customPrompt: mode === 'custom' ? customPrompt : undefined,
        withContext,
        translationGlossary: combinedGlossary || undefined,
        apiKey,
        model,
        provider,
        baseUrl,
        thinkingLevel,
      })

      if (data.success && data.data?.visionInfo) {
        const incoming = data.data.visionInfo as AIVisionInfo[]
        const merged = mergeVisionInfo(
          originalTweet.visionInfo ?? [],
          incoming,
        )
        setVisionInfo(prev => mergeVisionInfo(prev, incoming))
        syncDraftsFromInfo(merged)
        updateTweet(tweetId, { visionInfo: merged })
        toast.success('AI 图片描述生成完成')
      }
    }
    catch (error: unknown) {
      console.error(error)
      toastAIError(error, {
        providerName,
        fallbackTitle: 'AI 图片描述生成失败',
      })
    }
    finally {
      setIsGenerating(false)
    }
  }, [
    visionConfig,
    photoIndexes,
    mode,
    customPrompt,
    withContext,
    originalTweet,
    tweetId,
    updateTweet,
    syncDraftsFromInfo,
    dictEntries,
    translationGlossary,
  ])

  /** 翻译步：把有 OCR 原文的图交给翻译模型（附推文上下文），结果写 drafts.translatedText */
  const translateOcr = useCallback(async () => {
    const { apiKey, model, provider, baseUrl, thinkingLevel, providerName }
      = translationConfig
    const items = photoIndexes
      .map(i => ({ index: i, originalText: drafts[i]?.originalText ?? '' }))
      .filter(item => item.originalText.trim().length > 0)
    if (items.length === 0) {
      toast.error('请先生成 OCR 结果')
      return
    }
    if (!apiKey || !model) {
      toast.error(`请配置 ${providerName} API Key`)
      return
    }

    setIsTranslating(true)
    try {
      const combinedGlossary = [dictEntries(), translationGlossary].filter(Boolean).join('\n')
      const { data } = await fetcher.post('/api/ai-vision', {
        action: 'translate',
        tweet: { id_str: tweetId, text: originalTweet.text },
        items,
        translationGlossary: combinedGlossary || undefined,
        apiKey,
        model,
        provider,
        baseUrl,
        thinkingLevel,
      })

      if (data.success && data.data?.translations) {
        const translations = data.data.translations as Array<{
          index: number
          translatedText: string
        }>
        setDrafts((prev) => {
          const next = { ...prev }
          for (const t of translations) {
            next[t.index] = {
              ...next[t.index],
              translatedText: t.translatedText,
            }
          }
          return next
        })
        toast.success('OCR 翻译完成')
      }
    }
    catch (error: unknown) {
      console.error(error)
      toastAIError(error, {
        providerName,
        fallbackTitle: 'OCR 翻译失败',
      })
    }
    finally {
      setIsTranslating(false)
    }
  }, [drafts, photoIndexes, translationConfig, originalTweet.text, tweetId, dictEntries, translationGlossary])

  const updateDraft = useCallback(
    (index: number, patch: Partial<VisionDraft>) => {
      setDrafts(prev => ({ ...prev, [index]: { ...prev[index], ...patch } }))
    },
    [],
  )

  const save = useCallback(() => {
    const next = applyVisionEdits(visionInfo, drafts, photoIndexes)
    updateTweet(tweetId, { visionInfo: next })
    // Phase 5：持久化 visionInfo 到 tweet localCache（plain-tweet/:id 截图路由重载后仍可渲染）
    void fetcher
      .post('/api/ai-vision', {
        action: 'save',
        tweet: { ...originalTweet, visionInfo: next },
      })
      .catch(() => {})
    setIsOpen(false)
  }, [tweetId, visionInfo, drafts, photoIndexes, updateTweet, originalTweet])

  return {
    isOpen,
    setIsOpen,
    initializeEditor,
    mode,
    setMode,
    customPrompt,
    setCustomPrompt,
    withContext,
    setWithContext,
    isGenerating,
    isTranslating,
    photoIndexes,
    visionInfo,
    drafts,
    updateDraft,
    generate,
    translateOcr,
    save,
    providerName: visionConfig.providerName,
  }
}
