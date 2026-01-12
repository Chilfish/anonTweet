import type { EnrichedTweet, Entity } from '~/types'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'

export function useTweetTranslation(tweet: EnrichedTweet, type: 'body' | 'alt' = 'body') {
  const { showTranslations, getTranslation, getTranslationVisibility } = useTranslationStore()
  const { enableAITranslation } = useAppConfigStore()
  const tweetId = tweet.id_str

  // getTranslation 返回值含义：
  // - Entity[]: 存在人工编辑的翻译（或初始化时提取的翻译）
  // - null: 用户显式隐藏/删除了翻译 (legacy behavior)
  // - undefined: 无人工记录
  const manualTranslation = getTranslation(tweetId)
  const visibility = getTranslationVisibility(tweetId)

  // 1. 全局开关检查
  if (!showTranslations) {
    return { shouldShow: false, entities: null }
  }

  // 2. 显式隐藏检查 (Visibility Priority)
  // 如果对应的 visibility 为 false，则不显示
  if (type === 'body' && !visibility.body) {
    return { shouldShow: false, entities: null }
  }
  if (type === 'alt' && !visibility.alt) {
    return { shouldShow: false, entities: null }
  }

  // Legacy fallback: 如果 manualTranslation 为 null (旧的 hidden 状态)，也不显示
  if (manualTranslation === null) {
    return { shouldShow: false, entities: null }
  }

  // 3. 确定显示内容：人工翻译 > AI 翻译
  let entities: Entity[] | null = null

  if (manualTranslation) {
    entities = manualTranslation
  }
  else if (enableAITranslation && tweet.autoTranslationEntities?.length) {
    entities = tweet.autoTranslationEntities
  }

  // 4. 最终决定是否显示
  const shouldShow = !!entities

  return { shouldShow, entities }
}
