import type { Route } from './+types/vision'
import type { EnrichedTweet } from '~/types'
import { data } from 'react-router'
import { z } from 'zod'
import { normalizeAIError } from '~/lib/ai-error'
import { models } from '~/lib/constants'
import { setLocalCache } from '~/lib/localCache'
import { getProviderStrategy } from '~/lib/providers'
import { runImageVision } from '~/lib/vision/describeImages'
import { mergeVisionInfo } from '~/lib/vision/parse'
import { translateVisionOCR } from '~/lib/vision/translateOCR'

/**
 * POST /api/ai-vision
 *
 * AI 视觉描述独立端点（DR-6：不复用翻译路由的 force/isZh 守卫）。
 * 三条路径（按请求形态区分，各自 strict 校验）：
 * - 生成：mediaIndexes + mode → runImageVision → AIVisionInfo[]
 * - OCR 翻译：action: 'translate' + items → 翻译模型（附推文上下文）→ translations[]
 * - 保存：action: 'save' + tweet（带最终 visionInfo）→ 写回 tweet localCache
 *
 * 缓存持久化（Phase 5）：visionInfo 随 tweet 写回 localCache（对齐 ai-translation 的
 * setLocalCache），plain-tweet/:id 截图路由重载后仍能渲染。DB 落库留二期 TODO。
 */

const aiConfigFields = {
  apiKey: z.string().min(1),
  model: z.string().min(1),
  provider: z.enum(['google', 'deepseek', 'openrouter']).optional(),
  baseUrl: z.string().optional(),
  thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional(),
} as const

const tweetField = z.object({
  id_str: z.string().min(1),
  text: z.string(),
}).passthrough() // EnrichedTweet 复杂，只校验关键字段 + 透传全量

const generateSchema = z.object({
  tweet: tweetField,
  mediaIndexes: z.array(z.number().int().min(0)).min(1),
  mode: z.enum(['describe', 'ocr', 'custom']),
  customPrompt: z.string().max(2000).optional(),
  withContext: z.boolean().optional(),
  ...aiConfigFields,
}).strict()

const translateSchema = z.object({
  action: z.literal('translate'),
  tweet: tweetField,
  items: z.array(z.object({
    index: z.number().int().min(0),
    originalText: z.string(),
  })).min(1),
  ...aiConfigFields,
}).strict()

const saveSchema = z.object({
  action: z.literal('save'),
  tweet: tweetField,
}).strict()

export async function action({ request }: Route.ActionArgs) {
  let body: unknown
  try {
    body = await request.json()
  }
  catch {
    return data({ success: false, error: 'Invalid JSON body', status: 400 })
  }

  // 三条路径均 strict：translate/save 带 action + 各自字段，generate 不带 action（多余键被拒），天然互斥
  const translate = translateSchema.safeParse(body)
  if (translate.success) {
    return handleTranslate(translate.data)
  }

  const save = saveSchema.safeParse(body)
  if (save.success) {
    return handleSave(save.data)
  }

  const generate = generateSchema.safeParse(body)
  if (generate.success) {
    return handleGenerate(generate.data)
  }

  return data({
    success: false,
    error: 'Invalid request',
    status: 400,
    message: {
      generate: generate.error.flatten(),
      translate: translate.error.flatten(),
      save: save.error.flatten(),
    },
  })
}

async function handleGenerate(
  args: z.infer<typeof generateSchema>,
) {
  const { tweet, mediaIndexes, mode, customPrompt, withContext, apiKey, model, provider, baseUrl, thinkingLevel } = args
  try {
    const visionInfo = await runImageVision({
      tweet: tweet as Parameters<typeof runImageVision>[0]['tweet'],
      mediaIndexes,
      mode,
      customPrompt,
      withContext,
      apiKey,
      model,
      provider: provider ?? 'google',
      baseUrl,
      thinkingLevel,
    })

    // 持久化：合并进 tweet 的 visionInfo 写回 localCache（best-effort，失败不阻断）
    const merged = mergeVisionInfo((tweet as EnrichedTweet).visionInfo ?? [], visionInfo)
    try {
      await setLocalCache({
        id: tweet.id_str,
        type: 'tweet',
        value: { ...tweet, visionInfo: merged } as EnrichedTweet,
      })
    }
    catch {}

    return data({ success: true, data: { visionInfo } })
  }
  catch (error: unknown) {
    console.error('[Vision] Failed:', error)
    return data({
      success: false,
      error: 'Vision generation failed',
      status: 500,
      message: error instanceof Error ? error.message : '未知错误',
      aiError: normalizeAIError(error),
    })
  }
}

async function handleSave(
  args: z.infer<typeof saveSchema>,
) {
  const { tweet } = args
  try {
    await setLocalCache({
      id: tweet.id_str,
      type: 'tweet',
      value: tweet as EnrichedTweet,
    })
    return data({ success: true })
  }
  catch (error: unknown) {
    console.error('[Vision Save] Failed:', error)
    return data({
      success: false,
      error: 'Vision save failed',
      status: 500,
      message: error instanceof Error ? error.message : '未知错误',
    })
  }
}

async function handleTranslate(
  args: z.infer<typeof translateSchema>,
) {
  const { tweet, items, apiKey, model, provider, baseUrl, thinkingLevel } = args
  try {
    const modelConfig = models.find(m => m.name === model)
    const resolvedProvider = provider || modelConfig?.provider || 'google'
    const strategy = getProviderStrategy(resolvedProvider)
    const modelInstance = strategy.createSDKProvider(apiKey, baseUrl)(model)

    const translations = await translateVisionOCR({
      items,
      tweetText: tweet.text,
      modelInstance,
      thinkingLevel,
    })
    return data({ success: true, data: { translations } })
  }
  catch (error: unknown) {
    console.error('[Vision Translate] Failed:', error)
    return data({
      success: false,
      error: 'Vision OCR translation failed',
      status: 500,
      message: error instanceof Error ? error.message : '未知错误',
      aiError: normalizeAIError(error),
    })
  }
}
