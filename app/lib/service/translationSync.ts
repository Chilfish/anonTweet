import type { TweetData } from '~/types'
import axios from 'axios'
import { toastManager } from '~/components/ui/toast'
import { flatTweets } from '~/lib/utils'

export async function syncTranslationData(tweets: TweetData) {
  const flatedTweet = flatTweets(tweets)
  // 提取有翻译内容的实体
  const data = flatedTweet.map((tweet) => {
    const entities = tweet.entities
      .filter(entity => ['hashtag', 'text', 'media_alt'].includes(entity.type))
      .filter(entity => !!entity.translation?.trim())

    if (entities.length === 0)
      return null
    return { tweetId: tweet.id_str, entities }
  }).filter(Boolean)

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
