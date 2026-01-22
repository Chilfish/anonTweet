import type { EnrichedTweet, Entity } from '~/types'
import { useCallback, useState } from 'react'
import { useTranslationActions } from '~/lib/stores/hooks'
import { decodeHtmlEntities } from '~/lib/utils'

export function useAltTranslationLogic(originalTweet: EnrichedTweet) {
  const tweetId = originalTweet.id_str
  const [isOpen, setIsOpen] = useState(false)
  const [editingEntities, setEditingEntities] = useState<Entity[]>([])

  const { getTranslation, setTranslation, setTranslationVisibility } = useTranslationActions()

  // 初始化逻辑：以原始 Tweet 的结构为基准，回填已有的翻译
  const initializeEditor = useCallback(() => {
    const existingTranslation = getTranslation(tweetId)
    const aiTranslation = originalTweet.autoTranslationEntities

    // 1. 决定数据源优先级：人工保存 > AI 自动 > 原文
    const sourceEntities = (existingTranslation && existingTranslation.length > 0)
      ? existingTranslation
      : (aiTranslation && aiTranslation.length > 0 ? aiTranslation : [])

    // 2. 合并数据
    const mergedEntities = sourceEntities.map((entity) => {
      // 只有 media_alt 需要处理，但必须保留其他实体在数组中以维持结构完整性
      if (entity.type !== 'media_alt')
        return entity

      const match = sourceEntities.find(e => e.index === entity.index)
      let translation = match ? (match.translation || match.text) : ''

      // 解码实体，防止 HTML 字符被再次编码
      if (translation) {
        translation = decodeHtmlEntities(translation)
      }

      return { ...entity, translation }
    })

    setEditingEntities(mergedEntities)
    setIsOpen(true)
  }, [tweetId, originalTweet, getTranslation])

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
    setTranslationVisibility(tweetId, { alt: false })
    setIsOpen(false)
  }, [tweetId, setTranslationVisibility])

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
  }
}
