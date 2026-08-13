import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo, VisionMode } from '~/types/vision'
import { useCallback, useState } from 'react'
import { toastAIError } from '~/lib/ai-error-toast'
import { fetcher } from '~/lib/fetcher'
import { useResolvedAIVisionConfig, useTranslationActions } from '~/lib/stores/hooks'
import { toast } from '~/lib/utils'
import { applyManualOverrides, mergeVisionInfo } from '~/lib/vision/parse'

/**
 * AI 视觉描述 —— 编辑弹窗逻辑（app/hooks/use-vision-logic.ts）
 *
 * 弹窗级状态：mode（describe/ocr/custom）+ withContext + customPrompt 作用于一次
 * AI 生成请求（对齐 POST /api/ai-vision 的单 mode 多 index 语义）。
 * 逐图状态：visionInfo（AI 结果工作副本）+ manualTexts（手动覆盖，resolveVisionView 中
 * manual > ai，Postmortem #002：合并/覆盖逻辑全部下沉 lib/vision/parse.ts 纯函数）。
 */
export function useVisionLogic(originalTweet: EnrichedTweet) {
  const tweetId = originalTweet.id_str
  const photoIndexes = (originalTweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
    .map(x => x.i)

  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<VisionMode>('describe')
  const [customPrompt, setCustomPrompt] = useState('')
  const [withContext, setWithContext] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [visionInfo, setVisionInfo] = useState<AIVisionInfo[]>([])
  const [manualTexts, setManualTexts] = useState<Record<number, string>>({})

  const aiConfig = useResolvedAIVisionConfig()
  const { updateTweet } = useTranslationActions()

  const initializeEditor = useCallback(() => {
    const base = originalTweet.visionInfo ?? []
    setVisionInfo(base)
    setMode(base[0]?.mode ?? 'describe')
    setCustomPrompt('')
    setWithContext(true)
    setManualTexts(
      Object.fromEntries(
        base.filter(v => v.manualDescription).map(v => [v.index, v.manualDescription!]),
      ),
    )
    setIsOpen(true)
  }, [originalTweet.visionInfo])

  const generate = useCallback(async () => {
    const { apiKey, model, provider, baseUrl, thinkingLevel, providerName } = aiConfig
    if (!apiKey || !model) {
      toast.error(`请配置 ${providerName} API Key`)
      return
    }
    if (photoIndexes.length === 0)
      return

    setIsGenerating(true)
    try {
      const { data } = await fetcher.post('/api/ai-vision', {
        tweet: originalTweet,
        mediaIndexes: photoIndexes,
        mode,
        customPrompt: mode === 'custom' ? customPrompt : undefined,
        withContext,
        apiKey,
        model,
        provider,
        baseUrl,
        thinkingLevel,
      })

      if (data.success && data.data?.visionInfo) {
        const incoming = data.data.visionInfo as AIVisionInfo[]
        const merged = mergeVisionInfo(originalTweet.visionInfo ?? [], incoming)
        setVisionInfo(prev => mergeVisionInfo(prev, incoming))
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
  }, [aiConfig, photoIndexes, mode, customPrompt, withContext, originalTweet, tweetId, updateTweet])

  const updateManual = useCallback((index: number, value: string) => {
    setManualTexts(prev => ({ ...prev, [index]: value }))
  }, [])

  const save = useCallback(() => {
    const next = applyManualOverrides(visionInfo, manualTexts, photoIndexes)
    updateTweet(tweetId, { visionInfo: next })
    setIsOpen(false)
  }, [tweetId, visionInfo, manualTexts, photoIndexes, updateTweet])

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
    photoIndexes,
    visionInfo,
    manualTexts,
    updateManual,
    generate,
    save,
    providerName: aiConfig.providerName,
  }
}
