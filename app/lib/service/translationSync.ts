import type { EnrichedTweet, Entity, TweetData } from '~/types'
import axios from 'axios'
import { toastManager } from '~/components/ui/toast'
import { materializeTweetsWithManualTranslations } from '~/lib/translation/materialize'
import { resolveAIEntitiesForDisplay } from '~/lib/translation/resolveEntities'
import { flatTweets } from '~/lib/utils'

function combineEntities(tweet: EnrichedTweet) {
  if (tweet.autoTranslationEntities && tweet.autoTranslationEntities.length > 0) {
    // 注意：AI 结果可能是“翻译实体流”（结构与原文不同）。
    // 为避免按 index 合并导致错位，这里复用统一的 resolver。
    tweet.entities = resolveAIEntitiesForDisplay(tweet.entities, tweet.autoTranslationEntities)
  }
  return tweet
}

export async function syncTranslationData(
  tweets: TweetData,
  translations?: Record<string, Entity[] | null>,
) {
  const materialized = materializeTweetsWithManualTranslations(tweets, translations)
  const flatedTweet = flatTweets(materialized)

  // 提取有翻译内容的实体
  const data = flatedTweet
    .map(combineEntities)
    .map((tweet) => {
      const entities = tweet.entities
        .filter(entity => ['hashtag', 'text', 'media_alt'].includes(entity.type))
        .filter(entity => !!entity.translation?.trim())
        // 避免把空原文写进 DB（AI stream 偶尔会产生额外片段，无法可靠回填原文）
        .filter(entity => entity.type !== 'text' || !!entity.text?.trim())

      if (entities.length === 0)
        return null
      return { tweetId: tweet.id_str, entities }
    })
    .filter(Boolean)

  if (data.length === 0)
    return

  try {
    const res = await axios.post('/api/tweet/set', {
      data,
      intent: 'updateEntities',
    })
    if (res.data.success) {
      toastManager.add({ title: '翻译结果已缓存', type: 'success' })
    }
  }
  catch (error) {
    console.error(error)
    toastManager.add({ title: '保存翻译结果失败', type: 'error' })
  }
}
