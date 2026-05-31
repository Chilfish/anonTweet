import type { Route } from './+types/ai-translation'
import type { AITranslationSchema } from '~/lib/validations/tweet'
import { data } from 'react-router'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { models } from '~/lib/constants'
import { setLocalCache } from '~/lib/localCache'
import { getProviderStrategy } from '~/lib/providers'
import { updateIGPostTranslation } from '~/lib/service/getIGPost.server'
import { translateIGCaption } from '~/lib/translateIGCaption'

/**
 * POST /api/ai-translation
 *
 * 统一 AI 翻译端点，通过 `type` 区分：
 * - `twitter` (默认): 翻译推文实体
 * - `ins`: 翻译 Instagram caption
 */
export async function action({ request }: Route.ActionArgs) {
  const jsonData: AITranslationSchema = await request.json()

  // ─── IG 分支 ────────────────────────────────────
  if (jsonData.type === 'ins') {
    return handleIGTranslation(jsonData)
  }

  // ─── Twitter 分支（原逻辑） ────────────────────
  return handleTweetTranslation(jsonData)
}

/**
 * Instagram caption AI 翻译
 */
async function handleIGTranslation(args: Extract<AITranslationSchema, { type: 'ins' }>) {
  const {
    igPost,
    enableAITranslation: _enableAI,
    apiKey,
    model,
    thinkingLevel,
    translationGlossary,
    force,
  } = args

  if (!igPost || !igPost.description) {
    return data({
      success: false,
      error: 'Post not found or has no caption',
      status: 404,
    })
  }

  // 已有翻译且非强制
  if (!force && igPost.captionTranslation) {
    return data({
      success: true,
      message: 'Already translated',
      data: { captionTranslation: igPost.captionTranslation },
    })
  }

  if (!apiKey || !model) {
    return data({
      success: false,
      error: 'Missing apiKey or model',
      status: 400,
    })
  }

  try {
    const modelConfig = models.find(m => m.name === model)
    const provider = modelConfig?.provider || 'google'

    const strategy = getProviderStrategy(provider)
    const sdkProvider = strategy.createSDKProvider(apiKey)
    const modelInstance = sdkProvider.languageModel(model)

    const translated = await translateIGCaption({
      post: igPost,
      modelInstance,
      thinkingLevel,
      translationGlossary,
    })

    if (!translated) {
      return data({
        success: false,
        error: 'Translation returned empty',
        status: 500,
      })
    }

    // 写回 DB + localCache
    await updateIGPostTranslation(igPost.id, translated)

    return data({
      success: true,
      data: { captionTranslation: translated },
    })
  }
  catch (error: any) {
    console.error('[AI-Trans IG] Failed:', error)
    return data({
      success: false,
      error: 'Translation failed',
      status: 500,
      message: error.message,
    })
  }
}

/**
 * Twitter 推文实体翻译（原逻辑不变）
 */
async function handleTweetTranslation(args: Extract<AITranslationSchema, { tweet: any }>) {
  const {
    tweet,
    enableAITranslation,
    apiKey,
    model,
    thinkingLevel,
    translationGlossary,
    force,
  } = args

  try {
    if (!tweet) {
      return data({
        success: false,
        error: 'Tweet not found',
        status: 404,
        message: 'Tweet not found',
      })
    }

    const isZhTweet = tweet.lang === 'zh'
    const hasNewTranslation = tweet.entities?.some((e: any) => !!e.aiTranslation)
    const hasOldTranslation = !!tweet.autoTranslationEntities?.length
    const hasTranslation = hasNewTranslation || hasOldTranslation

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
        message: 'Invalid request data: API key or model is missing',
      })
    }

    const modelConfig = models.find(m => m.name === model)
    const provider = modelConfig?.provider || 'google'

    const mergedEntities = await autoTranslateTweet({
      tweet,
      apiKey,
      model,
      provider,
      thinkingLevel,
      translationGlossary,
    })

    try {
      await setLocalCache({
        id: tweet.id_str,
        type: 'tweet',
        value: {
          ...tweet,
          entities: mergedEntities,
          autoTranslationEntities: undefined,
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
      message: '翻译推文失败',
      cause: error.message,
    })
  }
}
