import type { EnrichedTweet, Entity } from '~/types'
import { useCallback, useRef, useState } from 'react'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { shouldRenderTranslatedEntitiesDirectly } from '~/lib/translation/resolveEntities'
import { decodeHtmlEntities, toast } from '~/lib/utils'

// 纯函数：初始化实体数据（核心业务逻辑）
function prepareInitialEntities(
  originalTweet: EnrichedTweet,
  existingTranslation: Entity[] | null,
  dictionaryEntries: any[],
): { entities: Entity[], prepend: string, hasPrepend: boolean } {
  // 深拷贝防止引用污染
  let baseEntities: Entity[] = JSON.parse(JSON.stringify(originalTweet.entities || []))

  // 1. 策略合并：
  // 优先级 A: 本地保存的手动翻译 (TranslationStore)
  if (existingTranslation && existingTranslation.length > 0) {
    baseEntities = baseEntities.map((original) => {
      const found = existingTranslation.find(e => e.index === original.index)
      return found ? { ...original, translation: found.translation } : original
    })
  }
  // 优先级 B: 推文自带的 AI 翻译字段 (aiTranslation)
  else if (baseEntities.some(e => !!e.aiTranslation)) {
    baseEntities = baseEntities.map((entity) => {
      if (entity.aiTranslation) {
        return { ...entity, translation: entity.aiTranslation }
      }
      return entity
    })
  }
  // 优先级 C: 兼容旧数据的独立数组 (autoTranslationEntities)
  else if (originalTweet.autoTranslationEntities?.length) {
    const ai = originalTweet.autoTranslationEntities
    baseEntities = baseEntities.map((original) => {
      const found = ai.find(e => e.index === original.index)
      const translation = found?.aiTranslation || found?.translation || found?.text
      return found ? { ...original, translation } : original
    })
  }

  // 2. 字典增强
  baseEntities = baseEntities.map((entity) => {
    if (entity.type === 'hashtag') {
      const match = dictionaryEntries.find(d => d.original === entity.text.replace('#', ''))
      if (match && !entity.translation) {
        entity.translation = `#${match.translated}`
      }
    }
    // 预处理 decode，避免 UI 层反复调用
    if (entity.translation) {
      entity.translation = decodeHtmlEntities(entity.translation)
    }
    return entity
  })

  // 3. 提取句首补充 (Index -1)
  let prependText = ''
  let hasPrepend = false

  // 检查现有翻译中是否有 prepend
  const existingPrepend = existingTranslation?.find(e => e.index === -1)
  if (existingPrepend) {
    prependText = existingPrepend.translation || existingPrepend.text || ''
    hasPrepend = true
  }

  return { entities: baseEntities, prepend: prependText, hasPrepend }
}

export function useTranslationEditorLogic(originalTweet: EnrichedTweet) {
  const tweetId = originalTweet.id_str
  const [isOpen, setIsOpen] = useState(false)
  const [isAITranslating, setIsAITranslating] = useState(false)

  // 状态提升为受控组件
  const [editingEntities, setEditingEntities] = useState<Entity[]>([])
  const [enablePrepend, setEnablePrepend] = useState(false)
  const [prependText, setPrependText] = useState('')
  const entityPosByIndexRef = useRef<Map<number, number>>(new Map())

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
  const dictionaryEntries = useTranslationDictionaryStore(state => state.entries)

  // 打开 Dialog 时的初始化逻辑
  const initializeEditor = useCallback(() => {
    const existing = getTranslation(tweetId) || []
    const { entities, prepend, hasPrepend } = prepareInitialEntities(originalTweet, existing, dictionaryEntries)

    const posMap = new Map<number, number>()
    entities.forEach((e, i) => posMap.set(e.index, i))
    entityPosByIndexRef.current = posMap

    setEditingEntities(entities)
    setPrependText(prepend)
    setEnablePrepend(hasPrepend)
    setIsOpen(true)
  }, [tweetId, originalTweet, getTranslation, dictionaryEntries])

  // 更新单个实体的翻译
  const updateEntityTranslation = useCallback((index: number, value: string) => {
    setEditingEntities((prev) => {
      const pos = entityPosByIndexRef.current.get(index)
      if (pos === undefined)
        return prev
      const current = prev[pos]
      if (!current)
        return prev
      if (current.translation === value)
        return prev

      const next = prev.slice()
      next[pos] = { ...current, translation: value }
      return next
    })
  }, [])

  // 保存逻辑
  const saveTranslations = useCallback(() => {
    const finalTranslations = [...editingEntities]
    const prependEntityIdx = finalTranslations.findIndex(entity => entity.index === -1)

    if (enablePrepend && prependText.trim()) {
      if (prependEntityIdx === -1) {
        finalTranslations.unshift({
          type: 'text',
          text: prependText,
          index: -1,
          translation: prependText,
        })
      }
      else {
        finalTranslations[prependEntityIdx]!.translation = prependText
      }
    }
    else if (prependEntityIdx !== -1) {
      finalTranslations.splice(prependEntityIdx, 1)
    }

    setTranslation(tweetId, finalTranslations)
    setTranslationVisibility(tweetId, { body: true })
    setIsOpen(false)
    console.log('[Editor] Saved Translation Data:', {
      tweetId,
      entities: finalTranslations,
    })
  }, [editingEntities, enablePrepend, prependText, setTranslation, setTranslationVisibility, tweetId])

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

        // 更新全局 Store 中的推文实体，确保外面实时显示
        updateTweet(tweetId, {
          entities: aiEntities,
          autoTranslationEntities: undefined,
        })

        // 回填到编辑器中：优先使用新生成的 aiTranslation
        setEditingEntities(prev => prev.map((entity) => {
          const found = aiEntities.find(e => e.index === entity.index)
          const translation = found?.aiTranslation || (found && found.text !== entity.text ? found.text : undefined)
          return found ? { ...entity, translation: translation || entity.translation } : entity
        }))

        const isStream = shouldRenderTranslatedEntitiesDirectly(originalTweet.entities || [], aiEntities)
        if (isStream) {
          toast.success('AI 翻译完成', {
            description: '已尽量按原文结构回填。由于翻译包含结构性调整，请手动检查是否对齐。',
          })
        }
        else {
          toast.success('AI 翻译完成')
        }
      }
    }
    catch (error: any) {
      console.error(error)
      toast.error(error.message || 'AI 翻译失败', {
        description: error.cause || '未知错误',
      })
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
  ])

  return {
    isOpen,
    setIsOpen,
    initializeEditor,

    // Data State
    editingEntities,
    enablePrepend,
    setEnablePrepend,
    prependText,
    setPrependText,

    // Actions
    updateEntityTranslation,
    saveTranslations,
    requestAITranslation,

    // Status
    isAITranslating,
    hasExistingTranslation: getTranslation(tweetId) !== null,
    enableAITranslation,
  }
}
