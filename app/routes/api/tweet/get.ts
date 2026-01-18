import type { Route } from './+types/get'
import type { Entity, TweetData } from '~/types'
import { data } from 'react-router'
import z from 'zod'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { getLocalCache } from '~/lib/localCache'
import { getEnrichedTweet } from '~/lib/react-tweet/utils/get-tweet'
import { TwitterError } from '~/lib/rettiwt-api'
import { getTweets } from '~/lib/service/getTweet'
import { getDBTweet, insertToTweetDB } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'
import { getTweetSchema } from '~/lib/validations/tweet'

const getLocalTweet = (tweetId: string) => getLocalCache({ id: tweetId, type: 'tweet', getter: () => getEnrichedTweet(tweetId) })

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
    tweets = await getTweets(tweetId, getDBTweet)
  }
  catch (error: any) {
    if (error instanceof TwitterError) {
      return {
        ...error,
        details: error.details.map(m => m.message).join('\n'),
      }
    }
    return []
  }

  // 并发处理所有推文的翻译（适用于 Thread/Conversation）
  // 使用 Promise.allSettled 或 Promise.all 都可以，这里直接用 Promise.all 等待完成
  // map 允许并行启动所有请求
  await Promise.all(
    tweets.map(async (tweet) => {
      const isZhTweet = tweet.lang === 'zh'
      if (tweet.autoTranslationEntities?.length || !enableAITranslation || isZhTweet) {
        return
      }

      if (!apiKey || !model) {
        console.warn('Invalid request data: API key or model is missing')
        return
      }

      try {
        const [mainTweet, quotedTweet] = await Promise.all([
          autoTranslateTweet({
            tweet,
            apiKey,
            model,
            thinkingLevel,
            translationGlossary,
          }),
          tweet.quotedTweet ? autoTranslateTweet({
            tweet: tweet.quotedTweet,
            apiKey,
            model,
            thinkingLevel,
            translationGlossary,
          }) : [] as Entity[],
        ])
        tweet.autoTranslationEntities = mainTweet
        tweet.quotedTweet && (tweet.quotedTweet.autoTranslationEntities = quotedTweet)

        await insertToTweetDB([tweet])
      }
      catch (e) {
        console.error(`Failed to translate tweet ${tweet.id_str}`, e)
        tweet.autoTranslationEntities = []
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
