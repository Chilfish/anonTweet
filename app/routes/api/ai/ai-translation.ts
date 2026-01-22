import type { Route } from './+types/ai-translation'
import type { AITranslationSchema } from '~/lib/validations/tweet'
import { data } from 'react-router'
import { autoTranslateTweet } from '~/lib/AITranslation'

/**
 *  POST /api/ai-translation
 */
export async function action({ request }: Route.ActionArgs) {
  const jsonData: AITranslationSchema = await request.json()

  const {
    tweet,
    enableAITranslation,
    apiKey,
    model,
    thinkingLevel,
    translationGlossary,
  } = jsonData

  try {
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

    return data({
      success: true,
      data: {
        tweetId: tweet.id_str,
        autoTranslationEntities: translation,
      },
    })
  }
  catch (error: any) {
    console.error(`Failed to translate tweet: ${error.message}`)
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: `Failed to generate text`,
      cause: error.message,
    })
  }
}
