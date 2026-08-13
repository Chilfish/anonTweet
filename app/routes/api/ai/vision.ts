import type { Route } from './+types/vision'
import { data } from 'react-router'
import { z } from 'zod'
import { normalizeAIError } from '~/lib/ai-error'
import { runImageVision } from '~/lib/vision/describeImages'

/**
 * POST /api/ai-vision
 *
 * AI 视觉描述独立端点（DR-6：不复用翻译路由的 force/isZh 守卫）。
 * 请求：tweet + mediaIndexes + mode + AI 配置；响应：AIVisionInfo[]。
 */

const visionRequestSchema = z.object({
  tweet: z.object({
    id_str: z.string().min(1),
    text: z.string(),
  }).passthrough(), // EnrichedTweet 复杂，只校验关键字段 + 透传全量
  mediaIndexes: z.array(z.number().int().min(0)).min(1),
  mode: z.enum(['describe', 'ocr', 'custom']),
  customPrompt: z.string().max(2000).optional(),
  withContext: z.boolean().optional(),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  provider: z.enum(['google', 'deepseek', 'openrouter']).optional(),
  baseUrl: z.string().optional(),
  thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional(),
}).strict()

export async function action({ request }: Route.ActionArgs) {
  let body: unknown
  try {
    body = await request.json()
  }
  catch {
    return data({ success: false, error: 'Invalid JSON body', status: 400 })
  }

  const parsed = visionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: z.flattenError(parsed.error),
    })
  }

  const {
    tweet,
    mediaIndexes,
    mode,
    customPrompt,
    withContext,
    apiKey,
    model,
    provider,
    baseUrl,
    thinkingLevel,
  } = parsed.data

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
