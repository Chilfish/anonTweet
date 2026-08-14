import type { ModelMessage } from 'ai'
import type { ModelConfig } from '~/lib/constants'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo, VisionMode } from '~/types/vision'
import { generateText, NoObjectGeneratedError, Output, zodSchema } from 'ai'
import { generateEntityContext } from '~/lib/AITranslation'
import { models } from '~/lib/constants'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
import { serializeForAI } from '~/lib/react-tweet'
import { fetchMediaImages } from './fetchImage'
import { buildVisionMessages } from './messages'
import {
  alignVisionIndexes,
  assertVisionResultCount,
  parseVisionResult,
  VisionContentError,
  VisionParseError,
} from './parse'
import { getVisionPreset } from './prompts'

/**
 * AI 视觉描述 —— 服务端编排（app/lib/vision/describeImages.ts）
 *
 * runImageVision：photo 过滤 → 抓图（base64 data URI）→ 组装上下文（实体参考 /
 * 官方 alt / 术语表，对齐翻译侧）→ buildVisionMessages → generateText(Output.object,
 * zodSchema(preset.schema)) → 数量断言 → parseVisionResult → alignVisionIndexes
 * （结果数与请求一致时按序对齐 mediaDetails 索引）→ 回填 provider/model。
 * 无 photo（或全 video/gif）→ 直接返回 []，不发起模型请求（AC-VISION-006）。
 * 校验失败重试一次（对齐翻译 validate+retry 模式）：schema strict 校验失败 /
 * 结构化输出失败 / 结果数量与图片数不符（防幻觉防线，见 parse.ts assertVisionResultCount）。
 */

/** media_alt 实体的 index 基线（20000+i，见 entitytParser.ts；与 types/vision.ts 注释一致） */
const MEDIA_ALT_INDEX_BASE = 20000

export interface RunImageVisionArgs {
  tweet: EnrichedTweet
  /** 需要描述的图片索引（对应 tweet.mediaDetails） */
  mediaIndexes: number[]
  mode: VisionMode
  customPrompt?: string
  /** 附推文上下文（ocr 翻译的关键开关） */
  withContext?: boolean
  /** 术语表（词典 + 自定义，HIGH 优先级；用于图中名称的准确译名，防瞎猜） */
  translationGlossary?: string
  apiKey: string
  model: string
  provider: string
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
}

const MAX_PARSE_RETRIES = 1
const VISION_TEMPERATURE = 0.2

/** 从推文实体中提取每张图的官方 alt 文本（media_alt，index 基线 20000+i） */
function buildMediaAltTexts(tweet: EnrichedTweet): Record<number, string> {
  const texts: Record<number, string> = {}
  for (const entity of tweet.entities ?? []) {
    if (entity.type !== 'media_alt' || !entity.text)
      continue
    const mediaIndex = entity.index - MEDIA_ALT_INDEX_BASE
    if (mediaIndex >= 0)
      texts[mediaIndex] = entity.text
  }
  return texts
}

function buildVisionRetryFeedback(err: unknown, imageCount: number): string {
  if (err instanceof VisionContentError) {
    return `上一次输出结果数量与图片数量不一致（共 ${imageCount} 张图片）。请为每张图片且仅每张图片输出一个对象，index 使用用户消息中给出的图片索引，不要合并或跳过任何图片。`
  }
  return `上一次输出未通过 schema 校验：${err instanceof Error ? err.message : String(err)}\n请重新输出严格符合 schema 的 JSON。`
}

export async function runImageVision({
  tweet,
  mediaIndexes,
  mode,
  customPrompt,
  withContext,
  translationGlossary,
  apiKey,
  model,
  provider,
  baseUrl,
  thinkingLevel = 'minimal',
}: RunImageVisionArgs): Promise<AIVisionInfo[]> {
  const mediaDetails = tweet.mediaDetails ?? []
  const photos = mediaDetails.filter(m => m.type === 'photo')

  // AC-VISION-006：无 photo → 返回空，不发起模型请求
  if (photos.length === 0) {
    return []
  }

  const preset = getVisionPreset(mode, customPrompt)
  const images = await fetchMediaImages(mediaDetails, mediaIndexes)
  if (images.length === 0) {
    return []
  }

  // 组装上下文（对齐翻译侧）：实体参考（hashtag/mention/URL 线索）+ 官方 alt 锚点 + 术语表
  const { entityMap } = serializeForAI(tweet.entities ?? [])
  const entityContext = generateEntityContext(entityMap)
  const mediaAltTexts = buildMediaAltTexts(tweet)
  const requestedAltTexts = Object.fromEntries(
    Object.entries(mediaAltTexts).filter(([index]) => images.some(img => img.index === Number(index))),
  )

  const messages = buildVisionMessages({
    images,
    preset,
    withContext,
    tweetText: tweet.text,
    quotedText: tweet.quotedTweet?.text,
    authorName: tweet.user?.screen_name,
    createdAt: tweet.created_at,
    entityContext,
    mediaAltTexts: requestedAltTexts,
    glossary: translationGlossary,
    customPrompt,
  })

  // AI SDK v7：system 提示不能放 messages（Gemini 等 provider 报
  // "System messages are not allowed... Use the instructions option instead"），
  // 必须拆出走 generateText 顶层 system 选项；chatMessages 只含 user 消息。
  const systemMessage = messages.find(
    (m): m is Extract<ModelMessage, { role: 'system' }> => m.role === 'system',
  )
  const system = systemMessage?.content
  const chatMessages = messages.filter(
    (m): m is Exclude<ModelMessage, { role: 'system' }> => m.role !== 'system',
  )

  const strategy = getProviderStrategy(provider)
  const modelInstance = strategy.createSDKProvider(apiKey, baseUrl)(model)
  const thinkingConfig = getThinkingConfig(model, thinkingLevel)
  const modelConfig: ModelConfig | undefined = models.find(m => m.name === model)

  const output = Output.object({
    schema: zodSchema(preset.schema),
    name: 'vision_result',
    description: `AI vision structured output for mode: ${preset.id}`,
  })

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_PARSE_RETRIES; attempt++) {
    try {
      const response = await generateText({
        model: modelInstance,
        system,
        messages: chatMessages,
        output,
        temperature: VISION_TEMPERATURE,
        providerOptions: modelConfig
          ? strategy.buildProviderOptions(thinkingConfig, modelConfig)
          : {},
      })

      const parsed = parseVisionResult(preset, response.output)
      // 数量断言：模型跳过/合并图片时按序对齐会错位（防幻觉防线）
      assertVisionResultCount(parsed, images.length)
      const info = alignVisionIndexes(
        parsed,
        images.map(img => img.index),
      )
      return info.map(i => ({ ...i, provider, model }))
    }
    catch (err) {
      lastError = err
      // 重试条件：schema 校验失败（VisionParseError）/ 结果数量不符（VisionContentError）
      // / SDK 结构化输出失败（NoObjectGeneratedError，模型未按 schema 产出——翻译步真实踩过该形态）
      const isRetryable
        = err instanceof VisionParseError
          || err instanceof VisionContentError
          || err instanceof NoObjectGeneratedError
      if (attempt < MAX_PARSE_RETRIES && isRetryable) {
        chatMessages.push({
          role: 'user',
          content: buildVisionRetryFeedback(err, images.length),
        })
        continue
      }
      break
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }
  throw new Error('Vision generation failed')
}
