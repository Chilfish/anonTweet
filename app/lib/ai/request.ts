import type { AITransportError } from '~/lib/ai-error'
import type { ArticleTranslation } from '~/lib/article/translate'
import type { AIProvider, AIRequestMode, ThinkingLevel } from '~/lib/stores/appConfig'
import type { EnrichedTweet, Entity, IGPost, TweetArticle } from '~/types'
import type { AIVisionInfo, VisionMode } from '~/types/vision'
import { generateText } from 'ai'
import { normalizeAIError } from '~/lib/ai-error'
import { createAITranslationAbortSignal } from '~/lib/ai-timeout'
import { autoTranslateTweet } from '~/lib/AITranslation'
import { autoTranslateArticle } from '~/lib/article/translate'
import { models } from '~/lib/constants'
import { fetcher } from '~/lib/fetcher'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { translateIGCaption } from '~/lib/translateIGCaption'
import { runImageVision } from '~/lib/vision/describeImages'
import { translateVisionOCR } from '~/lib/vision/translateOCR'

/**
 * AI 请求分发（`aiRequestMode`）。
 *
 * - `server`（默认）：调用本站 /api/ai-*，由 CF Worker 中继（服务端超时与 baseUrl 白名单在这一侧）
 * - `browser`：浏览器直接调用模型服务商，复用同一套翻译 / 识图管线，需要服务商允许跨域（CORS）
 *
 * 翻译结果的持久化与请求路径无关：编辑/保存仍走 `/api/tweet/set`、`/api/ig/translate/*`、
 * `syncArticleTranslation`，视觉保存走 `/api/ai-vision` 的 save 动作。
 *
 * 两种模式返回同一份响应体形状，调用方（hooks / 弹窗）只关心 `{ success, data }`。
 * 失败时与 `fetcher` 拦截器保持一致：抛出带 `aiError` 的对象，供 `toastAIError` 展示。
 */

const AI_TRANSLATION_ENDPOINT = '/api/ai-translation'
const AI_VISION_ENDPOINT = '/api/ai-vision'
const AI_TEST_ENDPOINT = '/api/ai-test'

/** 浏览器 fetch 的网络 / CORS 失败文案（Chrome / Firefox / Safari） */
const CORS_ERROR_RE = /failed to fetch|networkerror|load failed/i

export interface AIRequestFailure {
  success: false
  error: string
  status: number
  message: string
  targetId?: string
  targetType?: 'tweet' | 'article' | 'ig'
  model?: string
  provider?: string
  aiError: AITransportError
}

export type AIResponse<T> = { success: true, data: T } | AIRequestFailure

interface AIRequestContext {
  errorCode: string
  targetId?: string
  targetType?: 'tweet' | 'article' | 'ig'
  model?: string
  provider?: string
}

/** 当前生效的 AI 请求路径（设置面板写入，默认 server） */
export function getAIRequestMode(): AIRequestMode {
  return useAppConfigStore.getState().aiRequestMode
}

function getLanguageModel(payload: { apiKey: string, provider: AIProvider, baseUrl?: string, model: string }) {
  const strategy = getProviderStrategy(payload.provider)
  return strategy.createSDKProvider(payload.apiKey, payload.baseUrl)(payload.model)
}

function buildBrowserFailure(error: unknown, context: AIRequestContext): AIRequestFailure {
  const aiError = normalizeAIError(error)
  const corsHint = CORS_ERROR_RE.test(aiError.message)
    ? '（浏览器直连失败：请确认模型服务商允许 CORS，或在 AI 设置中切回服务端中继）'
    : ''

  console.error(`[AI/browser] ${context.errorCode} failed:`, error)

  return {
    success: false,
    error: context.errorCode,
    status: 500,
    message: `${aiError.message}${corsHint}`,
    targetId: context.targetId,
    targetType: context.targetType,
    model: context.model,
    provider: context.provider,
    aiError,
  }
}

async function dispatch<T>(
  endpoint: string,
  payload: unknown,
  context: AIRequestContext,
  runInBrowser: () => Promise<T>,
): Promise<AIResponse<T>> {
  if (getAIRequestMode() === 'server') {
    const { data } = await fetcher.post<AIResponse<T>>(endpoint, payload)
    return data
  }

  try {
    return { success: true, data: await runInBrowser() }
  }
  catch (error) {
    throw buildBrowserFailure(error, context)
  }
}

// ─── 推文翻译 ────────────────────────────────────────────

export interface TweetTranslationPayload {
  tweet: EnrichedTweet
  enableAITranslation: boolean
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
  force?: boolean
}

export interface TweetTranslationData {
  tweetId: string
  entities: Entity[]
}

export function requestTweetTranslation(
  payload: TweetTranslationPayload,
): Promise<AIResponse<TweetTranslationData>> {
  return dispatch(AI_TRANSLATION_ENDPOINT, payload, {
    errorCode: 'Failed to generate text',
    targetId: payload.tweet.id,
    targetType: 'tweet',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const entities = await autoTranslateTweet({
      tweet: payload.tweet,
      model: payload.model,
      provider: payload.provider,
      baseUrl: payload.baseUrl,
      translationGlossary: payload.translationGlossary,
      apiKey: payload.apiKey,
      thinkingLevel: payload.thinkingLevel,
    })
    return { tweetId: payload.tweet.id, entities }
  })
}

// ─── X Article 按块翻译 ─────────────────────────────────

export interface ArticleTranslationPayload {
  article: TweetArticle
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
}

export interface ArticleTranslationData {
  articleId: string
  translation: ArticleTranslation
}

export function requestArticleTranslation(
  payload: ArticleTranslationPayload,
): Promise<AIResponse<ArticleTranslationData>> {
  return dispatch(AI_TRANSLATION_ENDPOINT, { type: 'article', ...payload }, {
    errorCode: 'Translation failed',
    targetId: payload.article.id,
    targetType: 'article',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const translation = await autoTranslateArticle(payload.article, {
      modelInstance: getLanguageModel(payload),
      modelName: payload.model,
      thinkingLevel: payload.thinkingLevel,
      translationGlossary: payload.translationGlossary,
      targetId: payload.article.id,
    })
    return { articleId: payload.article.id, translation }
  })
}

// ─── Instagram caption 翻译 ─────────────────────────────

export interface IGTranslationPayload {
  igPost: IGPost
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
  force?: boolean
}

export interface IGTranslationData {
  captionTranslation: string
}

export function requestIGTranslation(
  payload: IGTranslationPayload,
): Promise<AIResponse<IGTranslationData>> {
  return dispatch(AI_TRANSLATION_ENDPOINT, {
    type: 'ins',
    enableAITranslation: true,
    ...payload,
  }, {
    errorCode: 'Translation failed',
    targetId: payload.igPost.id,
    targetType: 'ig',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const captionTranslation = await translateIGCaption({
      post: payload.igPost,
      modelInstance: getLanguageModel(payload),
      modelName: payload.model,
      thinkingLevel: payload.thinkingLevel,
      translationGlossary: payload.translationGlossary,
    })
    if (!captionTranslation) {
      throw new Error(
        `Translation returned empty (${payload.provider}/${payload.model})`,
      )
    }
    return { captionTranslation }
  })
}

// ─── 视觉生成 / OCR 翻译 ────────────────────────────────

export interface VisionGeneratePayload {
  tweet: EnrichedTweet
  mediaIndexes: number[]
  mode: VisionMode
  customPrompt?: string
  withContext?: boolean
  translationGlossary?: string
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
}

export interface VisionGenerateData {
  visionInfo: AIVisionInfo[]
}

export function requestVisionGenerate(
  payload: VisionGeneratePayload,
): Promise<AIResponse<VisionGenerateData>> {
  return dispatch(AI_VISION_ENDPOINT, payload, {
    errorCode: 'Vision generation failed',
    targetId: payload.tweet.id,
    targetType: 'tweet',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const visionInfo = await runImageVision(payload)
    return { visionInfo }
  })
}

export interface VisionTranslatePayload {
  tweet: { id: string, text: string }
  items: Array<{ index: number, originalText: string }>
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
}

export interface VisionTranslateData {
  translations: Array<{ index: number, translatedText: string }>
}

export function requestVisionTranslate(
  payload: VisionTranslatePayload,
): Promise<AIResponse<VisionTranslateData>> {
  return dispatch(AI_VISION_ENDPOINT, { action: 'translate', ...payload }, {
    errorCode: 'Vision OCR translation failed',
    targetId: payload.tweet.id,
    targetType: 'tweet',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const translations = await translateVisionOCR({
      items: payload.items,
      tweetText: payload.tweet.text,
      modelInstance: getLanguageModel(payload),
      modelName: payload.model,
      thinkingLevel: payload.thinkingLevel,
      translationGlossary: payload.translationGlossary,
    })
    return { translations }
  })
}

// ─── 连通性测试 ─────────────────────────────────────────

export interface AITestPayload {
  /** 服务端 schema 必填的占位推文 id（浏览器直连路径忽略） */
  tweetId?: string
  apiKey: string
  model: string
  provider: AIProvider
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
}

export interface AITestData {
  text: string
  model: string
  temperature: number
  thinkingConfig: unknown
}

export function requestAITest(payload: AITestPayload): Promise<AIResponse<AITestData>> {
  return dispatch(AI_TEST_ENDPOINT, { tweetId: '1', ...payload }, {
    errorCode: 'Failed to generate text',
    model: payload.model,
    provider: payload.provider,
  }, async () => {
    const modelConfig = models.find(m => m.name === payload.model)
    const strategy = getProviderStrategy(payload.provider)
    const thinkingConfig = getThinkingConfig(payload.model, payload.thinkingLevel)
    const temperature = 1
    const response = await generateText({
      model: getLanguageModel(payload),
      messages: [
        { role: 'user', content: 'hello' },
      ],
      temperature,
      providerOptions: modelConfig
        ? strategy.buildProviderOptions(thinkingConfig, modelConfig)
        : {},
      abortSignal: createAITranslationAbortSignal(),
    })
    return {
      text: response.text.trim(),
      model: payload.model,
      temperature,
      thinkingConfig,
    }
  })
}
