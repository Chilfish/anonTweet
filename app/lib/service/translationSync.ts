import type { EnrichedTweet, TweetData } from '~/types'
import axios from 'axios'
import { toastManager } from '~/components/ui/toast'
import { flatTweets } from '~/lib/utils'

function combineEntities(tweet: EnrichedTweet) {
  let baseEntities = tweet.entities

  if (tweet.autoTranslationEntities && tweet.autoTranslationEntities.length > 0) {
    // 情况 B: 命中服务端 AI 翻译
    // AI 结果可能缺失 text (原文)，或者 text 存放的是译文。我们只取其译文部分。
    baseEntities = baseEntities.map((original) => {
      const found = tweet.autoTranslationEntities?.find(e => e.index === original.index)
      const translation = found?.translation || found?.text
      return found ? { ...original, translation } : original
    })
  }
  tweet.entities = baseEntities

  return tweet
}

export async function syncTranslationData(tweets: TweetData) {
  const flatedTweet = flatTweets(tweets)

  // 提取有翻译内容的实体
  const data = flatedTweet
    .map(combineEntities)
    .map((tweet) => {
      const entities = [...tweet.entities, ...(tweet.autoTranslationEntities || [])]
        .filter(entity => ['hashtag', 'text', 'media_alt'].includes(entity.type))
        .filter(entity => !!entity.translation?.trim() && !!entity.text?.trim())

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
