import type { EnrichedTweet, Entity } from '~/types'
import { useCallback, useState } from 'react'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { decodeHtmlEntities, toast } from '~/lib/utils'

// 纯函数：初始化实体数据（核心业务逻辑）
function prepareInitialEntities(
  originalTweet: EnrichedTweet,
  existingTranslation: Entity[] | null,
  dictionaryEntries: any[],
): { entities: Entity[], prepend: string, hasPrepend: boolean } {
  // 深拷贝防止引用污染
  let baseEntities: Entity[] = JSON.parse(JSON.stringify(originalTweet.entities || []))
  const tweetWithAuto = originalTweet

  // 1. 策略合并：优先使用本地保存的翻译，其次是服务端 AI 翻译
  if (existingTranslation && existingTranslation.length > 0) {
    baseEntities = baseEntities.map((original) => {
      const found = existingTranslation.find(e => e.index === original.index)
      return found ? { ...original, translation: found.translation } : original
    })
  }
  else if (tweetWithAuto.autoTranslationEntities?.length) {
    baseEntities = baseEntities.map((original) => {
      const found = tweetWithAuto.autoTranslationEntities?.find(e => e.index === original.index)
      const translation = found?.translation || found?.text
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

  const { getTranslation, setTranslation, setTranslationVisibility } = useTranslationActions()
  const { enableAITranslation, geminiApiKey, geminiModel, geminiThinkingLevel, translationGlossary } = useAIConfig()
  const dictEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)
  const dictionaryEntries = useTranslationDictionaryStore(state => state.entries)

  // 打开 Dialog 时的初始化逻辑
  const initializeEditor = useCallback(() => {
    const existing = getTranslation(tweetId) || []
    const { entities, prepend, hasPrepend } = prepareInitialEntities(originalTweet, existing, dictionaryEntries)

    setEditingEntities(entities)
    setPrependText(prepend)
    setEnablePrepend(hasPrepend)
    setIsOpen(true)
  }, [tweetId, originalTweet, getTranslation, dictionaryEntries])

  // 更新单个实体的翻译
  const updateEntityTranslation = useCallback((index: number, value: string) => {
    setEditingEntities(prev => prev.map(e => e.index === index ? { ...e, translation: value } : e))
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
    // console.log(finalTranslations)
  }, [editingEntities, enablePrepend, prependText, setTranslation, setTranslationVisibility, tweetId])

  // AI 翻译逻辑
  const requestAITranslation = useCallback(async () => {
    if (!geminiApiKey || !geminiModel) {
      toast.error('请配置 AI Key')
      return
    }

    setIsAITranslating(true)
    try {
      const combinedGlossary = [dictEntries(), translationGlossary].filter(Boolean).join('\n')
      const { data } = await fetcher.post('/api/ai-translation', {
        tweet: originalTweet,
        enableAITranslation: true,
        apiKey: geminiApiKey,
        model: geminiModel,
        thinkingLevel: geminiThinkingLevel,
        translationGlossary: combinedGlossary,
      })

      if (data.success && data.data?.autoTranslationEntities) {
        const aiTranslations = data.data.autoTranslationEntities as Entity[]

        setEditingEntities(prev => prev.map((entity) => {
          const aiEntity = aiTranslations.find(e => e.index === entity.index)
          return aiEntity ? { ...entity, translation: aiEntity.translation || aiEntity.text } : entity
        }))

        toast.success('AI 翻译完成')
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
  }, [geminiApiKey, geminiModel, geminiThinkingLevel, translationGlossary, dictEntries, originalTweet])

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
