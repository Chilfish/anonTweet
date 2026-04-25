import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { data } from 'react-router'
import z from 'zod'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { models } from '~/lib/constants'
import { setLocalCache } from '~/lib/localCache'
import { getTweets } from '~/lib/service/getTweet'
import { getLocalTweet, insertToTweetDB } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'
import { getTweetSchema } from '~/lib/validations/tweet'

export async function action({ request }: Route.ActionArgs) {
  const jsonData = await request.json()
  const submission = getTweetSchema.safeParse(jsonData)

  if (!submission.success || !submission.data) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: `Invalid request data`,
      cause: z.flattenError(submission.error),
    })
  }

  const {
    tweetId: _id,
    enableAITranslation,
    apiKey,
    model,
    thinkingLevel,
    translationGlossary,
  } = submission.data || {
    tweetId: '',
    enableAITranslation: false,
    apiKey: '',
    model: '',
    translationGlossary: '',
  }

  const tweetId = extractTweetId(_id)

  if (!tweetId) {
    return []
  }

  let tweets: TweetData = []
  try {
    tweets = await getTweets(tweetId, getLocalTweet)
  }
  catch (error: any) {
    console.log(`get tweet ${tweetId}`, error)
    return data({
      success: false,
      error: 'Tweet not found',
      status: 404,
      message: error.message,
    })
  }

  await Promise.all(
    tweets.map(async (tweet) => {
      const isZhTweet = tweet.lang === 'zh'
      const hasTranslation = tweet.entities?.some(e => !!e.aiTranslation) || !!tweet.autoTranslationEntities?.length
      if (hasTranslation || !enableAITranslation || isZhTweet) {
        return
      }

      if (!apiKey || !model) {
        console.warn('Invalid request data: API key or model is missing')
        return
      }

      const modelConfig = models.find(m => m.name === model)
      const provider = modelConfig?.provider || 'google'

      try {
        const [mainEntities, quotedEntities] = await Promise.all([
          autoTranslateTweet({
            tweet,
            apiKey,
            model,
            provider,
            thinkingLevel,
            translationGlossary,
          }),
          tweet.quotedTweet
            ? autoTranslateTweet({
                tweet: tweet.quotedTweet,
                apiKey,
                model,
                provider,
                thinkingLevel,
                translationGlossary,
              })
            : Promise.resolve(null),
        ])

        tweet.entities = mainEntities
        tweet.autoTranslationEntities = undefined // 清理旧字段

        if (tweet.quotedTweet && quotedEntities) {
          tweet.quotedTweet.entities = quotedEntities
          tweet.quotedTweet.autoTranslationEntities = undefined // 清理旧字段
        }

        await insertToTweetDB([tweet])

        // 无 DB / DB 未命中时，tweet 可能来自 local cache 的“未翻译版本”；
        // 这里主动刷新缓存，避免后续请求重复翻译导致变慢。
        await setLocalCache({ id: tweet.id_str, type: 'tweet', value: tweet })
        if (tweet.quotedTweet) {
          await setLocalCache({ id: tweet.quotedTweet.id_str, type: 'tweet', value: tweet.quotedTweet })
        }
      }
      catch (e) {
        console.error(`Failed to translate tweet ${tweet.id_str}`, e)
      }
    }),
  )

  return tweets
}

export async function loader({
  params,
}: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }
  try {
    const tweets = await getTweets(tweetId)
    return tweets
  }
  catch (error: any) {
    console.log(`Error fetching tweets for ${tweetId}: ${error.message}`)
    return data({
      error: 'Failed to fetch tweets',
      message: `无法获取推文，${error.message}`,
    }, {
      status: error.status || 500,
    })
  }
}
