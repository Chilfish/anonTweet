import type { EnrichedTweet, Entity } from '~/types'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'

export function useTweetTranslation(tweet: EnrichedTweet) {
  const { showTranslations, getTranslation } = useTranslationStore()
  const { enableAITranslation } = useAppConfigStore()
  const tweetId = tweet.id_str

  // getTranslation 返回值含义：
  // - Entity[]: 存在人工编辑的翻译（或初始化时提取的翻译）
  // - null: 用户显式隐藏/删除了翻译
  // - undefined: 无人工记录
  const manualTranslation = getTranslation(tweetId)

  // 1. 全局开关检查
  if (!showTranslations) {
    return { shouldShow: false, entities: null }
  }

  // 2. 显式隐藏检查：如果用户删除了翻译，则不再显示
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
