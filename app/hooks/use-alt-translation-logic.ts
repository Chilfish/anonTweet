import type { EnrichedTweet, Entity } from '~/types'
import { useCallback, useState } from 'react'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { decodeHtmlEntities, toast } from '~/lib/utils'

export function useAltTranslationLogic(originalTweet: EnrichedTweet) {
  const tweetId = originalTweet.id_str
  const [isOpen, setIsOpen] = useState(false)
  const [editingEntities, setEditingEntities] = useState<Entity[]>([])
  const [isAITranslating, setIsAITranslating] = useState(false)

  const { getTranslation, setTranslation, setTranslationVisibility, updateTweet } = useTranslationActions()
  const {
    aiProvider,
    geminiApiKey,
    geminiModel,
    geminiThinkingLevel,
    deepseekApiKey,
    deepseekModel,
    deepseekThinkingLevel,
    enableAITranslation,
    translationGlossary,
  } = useAIConfig()
  const dictEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)

  // 初始化逻辑：以原始 Tweet 的结构为基准，回填已有的翻译
  const initializeEditor = useCallback(() => {
    const manual = getTranslation(tweetId)
    const baseEntities = originalTweet.entities || []

    // 决定数据源优先级：人工保存 > 新版 AI (aiTranslation) > 旧版 AI (autoTranslationEntities) > 原文
    const mergedEntities = baseEntities.map((entity) => {
      // 只有 media_alt 需要处理
      if (entity.type !== 'media_alt')
        return entity

      let translation = ''

      // 1. 优先取人工翻译
      if (manual && manual.length > 0) {
        const match = manual.find(e => e.index === entity.index)
        if (match)
          translation = match.translation || ''
      }

      // 2. 其次取新版 AI 翻译
      if (!translation && entity.aiTranslation) {
        translation = entity.aiTranslation
      }

      // 3. 再次取旧版 AI 翻译兼容
      if (!translation && originalTweet.autoTranslationEntities?.length) {
        const match = originalTweet.autoTranslationEntities.find(e => e.index === entity.index)
        if (match)
          translation = match.aiTranslation || match.translation || match.text || ''
      }

      // 解码实体，防止 HTML 字符被再次编码
      if (translation) {
        translation = decodeHtmlEntities(translation)
      }

      return { ...entity, translation }
    })

    setEditingEntities(mergedEntities)
    setIsOpen(true)
  }, [tweetId, originalTweet, getTranslation])

  // AI 翻译逻辑
  const requestAITranslation = useCallback(async () => {
    const apiKey = aiProvider === 'google' ? geminiApiKey : deepseekApiKey
    const model = aiProvider === 'google' ? geminiModel : deepseekModel
    const thinkingLevel = aiProvider === 'google' ? geminiThinkingLevel : deepseekThinkingLevel

    if (!apiKey || !model) {
      toast.error(`请配置 ${aiProvider === 'google' ? 'Gemini' : 'DeepSeek'} API Key`)
      return
    }

    setIsAITranslating(true)
    try {
      const combinedGlossary = [dictEntries(), translationGlossary].filter(Boolean).join('\n')
      const { data } = await fetcher.post('/api/ai-translation', {
        tweet: originalTweet,
        enableAITranslation: true,
        apiKey,
        model,
        thinkingLevel,
        translationGlossary: combinedGlossary,
        force: true,
      })

      if (data.success && data.data?.entities) {
        const aiEntities = data.data.entities as Entity[]

        // 更新全局 Store 中的推文实体
        updateTweet(tweetId, {
          entities: aiEntities,
          autoTranslationEntities: undefined,
        })

        // 回填到编辑器中：过滤出 media_alt 类型的翻译
        setEditingEntities(prev => prev.map((entity) => {
          if (entity.type !== 'media_alt')
            return entity
          const found = aiEntities.find(e => e.index === entity.index)
          const translation = found?.aiTranslation || (found && found.text !== entity.text ? found.text : undefined)
          return found ? { ...entity, translation: translation || entity.translation } : entity
        }))

        toast.success('AI 翻译完成')
      }
    }
    catch (error: any) {
      console.error(error)
      toast.error(error.message || 'AI 翻译失败')
    }
    finally {
      setIsAITranslating(false)
    }
  }, [
    aiProvider,
    geminiApiKey,
    geminiModel,
    geminiThinkingLevel,
    deepseekApiKey,
    deepseekModel,
    deepseekThinkingLevel,
    translationGlossary,
    dictEntries,
    originalTweet,
    updateTweet,
    tweetId,
  ])

  // 更新单个 Alt 文本
  const updateAltTranslation = useCallback((index: number, value: string) => {
    setEditingEntities(prev => prev.map(e => e.index === index ? { ...e, translation: value } : e))
  }, [])

  // 保存
  const saveTranslations = useCallback(() => {
    setTranslation(tweetId, editingEntities)
    setTranslationVisibility(tweetId, { alt: true })
    setIsOpen(false)
  }, [tweetId, editingEntities, setTranslation, setTranslationVisibility])

  // 隐藏/删除显示
  const hideTranslations = useCallback(() => {
    setEditingEntities((prev) => {
      const next = prev.map((entity) => {
        if (entity.type === 'media_alt') {
          return { ...entity, translation: '' }
        }
        return entity
      })
      setTranslation(tweetId, next)
      return next
    })

    setTranslationVisibility(tweetId, { alt: true })
    setIsOpen(false)
  }, [tweetId, setTranslation, setTranslationVisibility])

  // 计算是否有可编辑的项
  const hasEditableAlts = editingEntities.some(e => e.type === 'media_alt')

  return {
    isOpen,
    setIsOpen,
    editingEntities,
    initializeEditor,
    updateAltTranslation,
    saveTranslations,
    hideTranslations,
    hasEditableAlts,
    hasExistingTranslation: getTranslation(tweetId) !== null,
    requestAITranslation,
    isAITranslating,
    enableAITranslation,
  }
}
