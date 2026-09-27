import type { Route } from './+types/ai-translation'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { AITranslationSchema } from '~/lib/validations/tweet'
import { data } from 'react-router'
import { isAllowedAIBaseUrl } from '~/lib/ai-base-url'
import { buildAIFailure } from '~/lib/ai-error'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { autoTranslateArticle } from '~/lib/article/translate'
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
 * - `article`: 按块翻译 X Article 长文
 */
export async function action({ request }: Route.ActionArgs) {
  const jsonData: AITranslationSchema = await request.json()

  // ─── IG 分支 ────────────────────────────────────
  if (jsonData.type === 'ins') {
    return handleIGTranslation(jsonData)
  }

  // ─── Article 分支 ───────────────────────────────
  if (jsonData.type === 'article') {
    return handleArticleTranslation(jsonData)
  }

  // ─── Twitter 分支（原逻辑） ────────────────────
  return handleTweetTranslation(jsonData)
}

/**
 * X Article 按块 AI 翻译
 */
async function handleArticleTranslation(args: Extract<AITranslationSchema, { type: 'article' }>) {
  const { article, apiKey, model, provider, baseUrl, thinkingLevel, translationGlossary } = args

  if (!article || (!article.blocks?.length && !article.title)) {
    return data({ success: false, error: 'Article not found or empty', status: 404, targetType: 'article', targetId: article?.id })
  }

  if (!apiKey || !model) {
    return data({ success: false, error: 'Missing apiKey or model', status: 400, targetType: 'article', targetId: article.id })
  }

  // AC-SEC-001：baseUrl 白名单校验
  if (!isAllowedAIBaseUrl(baseUrl)) {
    return data({
      success: false,
      error: 'baseUrl not allowed',
      status: 400,
      message: 'baseUrl 不在白名单内：仅支持官方提供商域名或 ALLOWED_AI_BASE_URL_HOSTS 扩展域名（AC-SEC-001，ENABLE_AI_BASE_URL_WHITELIST=true）',
      targetType: 'article',
      targetId: article.id,
    })
  }

  const modelConfig = models.find(m => m.name === model)
  const resolvedProvider = provider || modelConfig?.provider || 'google'

  try {
    const strategy = getProviderStrategy(resolvedProvider)
    const sdkProvider = strategy.createSDKProvider(apiKey, baseUrl)
    const modelInstance = sdkProvider.languageModel(model)

    const translation = await autoTranslateArticle(article, {
      modelInstance,
      modelName: model,
      thinkingLevel: thinkingLevel as ThinkingLevel | undefined,
      translationGlossary,
      targetId: article.id,
    })

    return data({
      success: true,
      data: { articleId: article.id, translation },
    })
  }
  catch (error: unknown) {
    return data(buildAIFailure(error, {
      errorCode: 'Translation failed',
      context: { targetType: 'article', targetId: article.id, model, provider: resolvedProvider },
    }))
  }
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
    provider,
    baseUrl,
    thinkingLevel,
    translationGlossary,
    force,
  } = args

  if (!igPost || !igPost.description) {
    return data({
      success: false,
      error: 'Post not found or has no caption',
      status: 404,
      targetId: igPost?.id,
      targetType: 'ig',
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
      targetId: igPost.id,
      targetType: 'ig',
    })
  }

  // AC-SEC-001：baseUrl 白名单校验（SSRF/滥用面）
  if (!isAllowedAIBaseUrl(baseUrl)) {
    return data({
      success: false,
      error: 'baseUrl not allowed',
      status: 400,
      message: 'baseUrl 不在白名单内：仅支持官方提供商域名或 ALLOWED_AI_BASE_URL_HOSTS 扩展域名（AC-SEC-001，ENABLE_AI_BASE_URL_WHITELIST=true）',
      targetId: igPost.id,
      targetType: 'ig',
    })
  }

  const modelConfig = models.find(m => m.name === model)
  const resolvedProvider = provider || modelConfig?.provider || 'google'

  try {
    const strategy = getProviderStrategy(resolvedProvider)
    const sdkProvider = strategy.createSDKProvider(apiKey, baseUrl)
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
        targetId: igPost.id,
        targetType: 'ig',
        model,
        provider: resolvedProvider,
      })
    }

    // 写回 DB + localCache
    await updateIGPostTranslation(igPost.id, translated)

    return data({
      success: true,
      data: { captionTranslation: translated },
    })
  }
  catch (error: unknown) {
    return data(buildAIFailure(error, {
      errorCode: 'Translation failed',
      context: { targetType: 'ig', targetId: igPost.id, model, provider: resolvedProvider },
    }))
  }
}

/**
 * Twitter 推文实体翻译（原逻辑不变）
 */
async function handleTweetTranslation(args: Extract<AITranslationSchema, { type?: 'twitter' }>) {
  const {
    tweet,
    enableAITranslation,
    apiKey,
    model,
    provider,
    baseUrl,
    thinkingLevel,
    translationGlossary,
    force,
  } = args

  const modelConfig = models.find(m => m.name === model)
  const resolvedProvider = provider || modelConfig?.provider || 'google'

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
    const hasNewTranslation = tweet.entities?.some(e => !!e.aiTranslation)
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
        targetId: tweet.id_str,
        targetType: 'tweet',
      })
    }

    // AC-SEC-001：baseUrl 白名单校验
    if (!isAllowedAIBaseUrl(baseUrl)) {
      return data({
        success: false,
        error: 'baseUrl not allowed',
        status: 400,
        message: 'baseUrl 不在白名单内：仅支持官方提供商域名或 ALLOWED_AI_BASE_URL_HOSTS 扩展域名（AC-SEC-001，ENABLE_AI_BASE_URL_WHITELIST=true）',
        targetId: tweet.id_str,
        targetType: 'tweet',
      })
    }

    const mergedEntities = await autoTranslateTweet({
      tweet,
      apiKey,
      model,
      provider: resolvedProvider,
      baseUrl,
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
    catch (error: unknown) {
      console.warn('[AI-Trans] local cache write failed:', error)
    }

    return data({
      success: true,
      data: {
        tweetId: tweet.id_str,
        entities: mergedEntities,
      },
    })
  }
  catch (error: unknown) {
    return data(buildAIFailure(error, {
      errorCode: 'Failed to generate text',
      message: '翻译推文失败',
      context: { targetType: 'tweet', targetId: tweet?.id_str, model, provider: resolvedProvider },
    }))
  }
}
