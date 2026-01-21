import type { Route } from './+types/ai-translation'
import { data } from 'react-router'
import z from 'zod'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { getLocalTweet } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'
import { getTweetSchema } from '~/lib/validations/tweet'

/**
 *  POST /api/ai-translation
 */
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
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: `Invalid tweetId`,
    })
  }

  try {
    const tweet = await getLocalTweet(tweetId)
    if (!tweet) {
      return data({
        success: false,
        error: 'Tweet not found',
        status: 404,
        message: `Tweet not found`,
      })
    }

    const isZhTweet = tweet.lang === 'zh'
    if (tweet.autoTranslationEntities?.length || !enableAITranslation || isZhTweet) {
      return
    }

    if (!apiKey || !model) {
      return data({
        success: false,
        error: 'Invalid request',
        status: 400,
        message: `Invalid request data: API key or model is missing`,
      })
    }

    const translation = await autoTranslateTweet({
      tweet,
      apiKey,
      model,
      thinkingLevel,
      translationGlossary,
    })

    if (!translation.length) {
      return data({
        success: false,
        error: 'Failed to translate tweet',
        status: 500,
        message: `Failed to translate tweet`,
      })
    }

    tweet.autoTranslationEntities = translation

    return data({
      success: true,
      data: {
        tweetId,
        autoTranslationEntities: translation,
      },
    })
  }
  catch (error: any) {
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: `Failed to generate text`,
      cause: error.message,
    })
  }
}
