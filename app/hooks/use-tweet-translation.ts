import type { EnrichedTweet, Entity } from '~/types'
import { useShallow } from 'zustand/react/shallow'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'

export function useTweetTranslation(tweet: EnrichedTweet, type: 'body' | 'alt' = 'body') {
  const {
    translationMode,
    tweetTranslationModes,
    translations,
    translationVisibility,
  } = useTranslationStore(
    useShallow(state => ({
      translationMode: state.translationMode,
      tweetTranslationModes: state.tweetTranslationModes,
      translations: state.translations,
      translationVisibility: state.translationVisibility,
    })),
  )
  const enableAITranslation = useAppConfigStore(state => state.enableAITranslation)
  const tweetId = tweet.id_str

  const mode = tweetTranslationModes[tweetId] || translationMode

  // 1. 模式检查
  if (mode === 'original') {
    return { shouldShow: false, entities: null }
  }

  // 2. 显式隐藏检查 (Visibility Priority)
  const visibility = translationVisibility[tweetId] || { body: true, alt: true }
  if (type === 'body' && !visibility.body) {
    return { shouldShow: false, entities: null }
  }
  if (type === 'alt' && !visibility.alt) {
    return { shouldShow: false, entities: null }
  }

  // 3. 确定显示内容：人工记录 > AI 翻译 > 传入数据兜底
  let entities: Entity[] = tweet.entities

  // 检查 Store 中的人工翻译记录
  const manualTranslation = translations[tweetId]

  // 辅助函数：将译文合并到原始实体中，确保原文 (text) 始终存在
  const mergeEntities = (base: Entity[], translated: Entity[]) => {
    return base.map((original) => {
      const found = translated.find(e => e.index === original.index)
      if (!found)
        return original
      // 译文优先取 .translation，如果没有（某些 AI 结果）则取 .text
      const translation = found.translation || (found.text !== original.text ? found.text : undefined)
      return { ...original, translation }
    })
  }

  if (manualTranslation) {
    // 处理人工翻译记录：如果是正常数组，则与原文合并
    entities = mergeEntities(tweet.entities || [], manualTranslation)
  }
  // 检查 AI 翻译
  else if (enableAITranslation && tweet.autoTranslationEntities?.length) {
    entities = mergeEntities(tweet.entities || [], tweet.autoTranslationEntities)
  }
  // 兜底：如果传入的 tweet.entities 本身就包含翻译内容
  else if (tweet.entities?.some(e => e.translation)) {
    entities = tweet.entities
  }

  const shouldShow = !!entities

  return { shouldShow, entities }
}
