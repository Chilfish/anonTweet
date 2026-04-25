import type { Route } from './+types/ai-translation'
import type { AITranslationSchema } from '~/lib/validations/tweet'
import { data } from 'react-router'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { models } from '~/lib/constants'
import { setLocalCache } from '~/lib/localCache'

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
    force,
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
    // 新规范：检查 entities 里的 aiTranslation
    const hasNewTranslation = tweet.entities?.some(e => !!e.aiTranslation)
    // 旧规范兼容
    const hasOldTranslation = !!tweet.autoTranslationEntities?.length
    const hasTranslation = hasNewTranslation || hasOldTranslation

    // 如果不是强制翻译，且已经有翻译结果、或未开启AI翻译、或是中文推文，则跳过
    if (!force && (hasTranslation || !enableAITranslation || isZhTweet)) {
      return data({
        success: true,
        message: 'No translation needed or already translated',
        data: {
          tweetId: tweet.id_str,
          entities: tweet.entities || [],
        },
      })
    }

    if (!apiKey || !model) {
      return data({
        success: false,
        error: 'Invalid request',
        status: 400,
        message: `Invalid request data: API key or model is missing`,
      })
    }

    const modelConfig = models.find(m => m.name === model)
    const provider = modelConfig?.provider || 'google'

    // autoTranslateTweet 现在返回合并后的 entities 数组
    const mergedEntities = await autoTranslateTweet({
      tweet,
      apiKey,
      model,
      provider,
      thinkingLevel,
      translationGlossary,
    })

    // 刷新本地缓存快照，避免后续请求重复翻译
    try {
      await setLocalCache({
        id: tweet.id_str,
        type: 'tweet',
        value: {
          ...tweet,
          entities: mergedEntities,
          autoTranslationEntities: undefined, // 清理旧字段
        },
      })
    }
    catch {}

    return data({
      success: true,
      data: {
        tweetId: tweet.id_str,
        entities: mergedEntities,
      },
    })
  }
  catch (error: any) {
    console.error(`Failed to translate tweet: ${error.message}`)
    return data({
      success: false,
      error: 'Failed to generate text',
      status: 500,
      message: `翻译推文失败`,
      cause: error.message,
    })
  }
}
