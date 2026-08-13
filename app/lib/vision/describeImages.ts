import type { ModelMessage } from 'ai'
import type { ModelConfig } from '~/lib/constants'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo, VisionMode } from '~/types/vision'
import { generateText, Output, zodSchema } from 'ai'
import { models } from '~/lib/constants'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
import { fetchMediaImages } from './fetchImage'
import { buildVisionMessages } from './messages'
import { alignVisionIndexes, parseVisionResult, VisionParseError } from './parse'
import { getVisionPreset } from './prompts'

/**
 * AI 视觉描述 —— 服务端编排（app/lib/vision/describeImages.ts）
 *
 * runImageVision：photo 过滤 → 抓图（base64 data URI）→ buildVisionMessages →
 * generateText(Output.object, zodSchema(preset.schema)) → parseVisionResult →
 * alignVisionIndexes（结果数与请求一致时按序对齐 mediaDetails 索引）→ 回填 provider/model。
 * 无 photo（或全 video/gif）→ 直接返回 []，不发起模型请求（AC-VISION-006）。
 * schema strict 校验失败时带错误提示重试一次（对齐翻译 validate+retry 模式）。
 */

export interface RunImageVisionArgs {
  tweet: EnrichedTweet
  /** 需要描述的图片索引（对应 tweet.mediaDetails） */
  mediaIndexes: number[]
  mode: VisionMode
  customPrompt?: string
  /** 附推文上下文（ocr 翻译的关键开关） */
  withContext?: boolean
  apiKey: string
  model: string
  provider: string
  baseUrl?: string
  thinkingLevel?: ThinkingLevel
}

const MAX_PARSE_RETRIES = 1
const VISION_TEMPERATURE = 0.2

export async function runImageVision({
  tweet,
  mediaIndexes,
  mode,
  customPrompt,
  withContext,
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

  const messages = buildVisionMessages({
    images,
    preset,
    withContext,
    tweetText: tweet.text,
    quotedText: tweet.quotedTweet?.text,
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

      const info = alignVisionIndexes(
        parseVisionResult(preset, response.output),
        images.map(img => img.index),
      )
      return info.map(i => ({ ...i, provider, model }))
    }
    catch (err) {
      lastError = err
      if (attempt < MAX_PARSE_RETRIES && err instanceof VisionParseError) {
        chatMessages.push({
          role: 'user',
          content: `上一次输出未通过 schema 校验：${err.message}\n请重新输出严格符合 schema 的 JSON。`,
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
