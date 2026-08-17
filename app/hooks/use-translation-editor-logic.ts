import type { EnrichedTweet, Entity } from '~/types'
import { useCallback, useRef, useState } from 'react'
import { toastAIError } from '~/lib/ai-error-toast'
import { fetcher } from '~/lib/fetcher'
import { syncTranslationData } from '~/lib/service/translationSync'
import { useAIConfig, useResolvedAIConfig, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { deriveManualTranslation, shouldRenderTranslatedEntitiesDirectly } from '~/lib/translation/resolveEntities'
import { decodeHtmlEntities, toast } from '~/lib/utils'

// 纯函数：初始化实体数据（核心业务逻辑）
function prepareInitialEntities(
  originalTweet: EnrichedTweet,
  existingTranslation: Entity[] | null,
  dictionaryEntries: any[],
): { entities: Entity[], prepend: string, hasPrepend: boolean } {
  // 深拷贝防止引用污染
  let baseEntities: Entity[] = JSON.parse(JSON.stringify(originalTweet.entities || []))

  // 1. 策略合并：单一选择链实现（AC-RESOLVER-001）
  // manual(按 index，命中即胜出) > 实体内联 aiTranslation > 旧版 autoTranslationEntities > 原文
  baseEntities = deriveManualTranslation(baseEntities, {
    manual: existingTranslation,
    legacyAI: originalTweet.autoTranslationEntities,
  })

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
    enableAITranslation,
    translationGlossary,
  } = useAIConfig()
  const aiConfig = useResolvedAIConfig()
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

    // 持久化到服务端（DB tweetEntities + localCache 刷新），刷新页面后仍可恢复
    // 手动翻译与句首补充（句首补充为 index: -1 的实体）。
    syncTranslationData([originalTweet], { [tweetId]: finalTranslations })

    console.log('[Editor] Saved Translation Data:', {
      tweetId,
      entities: finalTranslations,
    })
  }, [editingEntities, enablePrepend, prependText, setTranslation, setTranslationVisibility, tweetId, originalTweet])

  // AI 翻译逻辑
  const requestAITranslation = useCallback(async () => {
    const { apiKey, model, baseUrl, thinkingLevel, providerName, provider } = aiConfig

    if (!apiKey || !model) {
      toast.error(`请配置 ${providerName} API Key`)
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
        provider,
        baseUrl,
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
    catch (error: unknown) {
      console.error(error)
      toastAIError(error, {
        providerName,
        fallbackTitle: 'AI 翻译失败',
      })
    }
    finally {
      setIsAITranslating(false)
    }
  }, [
    aiConfig,
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
