import type { AIProviderName } from '~/lib/constants'
import type { EnrichedTweet, IGPost, TranslationEntity } from '~/types'
import { z } from 'zod'

export const tweetSchema = z.discriminatedUnion('intent', [
  z.object({
    intent: z.literal('update'),
    tweet: z.string(),
  }),
  z.object({
    intent: z.literal('create'),
    tweet: z.string(),
  }),
  z.object({
    intent: z.literal('updateEntities'),
    data: z.object({
      entities: z.custom<TranslationEntity[]>(),
      tweetId: z.string(),
    }).array(),
  }),
])

/**
 * GET /api/tweet/get 请求 Schema。
 *
 * 阶段二任务 1（AC-DECOUPLE-001）起，GET 不再内联 AI 翻译：以下 AI 字段
 * （enableAITranslation / apiKey / model / provider / baseUrl / thinkingLevel /
 * translationGlossary）为旧客户端兼容而保留，但路由不再读取——翻译统一走
 * POST /api/ai-translation，由客户端/截图 SSR 显式触发。
 */
export const getTweetSchema = z.object({
  tweetId: z.string().min(1),
  enableAITranslation: z.boolean().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  provider: z.enum(['google', 'deepseek', 'openrouter']).optional(),
  baseUrl: z.string().optional(),
  thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional(),
  translationGlossary: z.string().optional(),
  force: z.boolean().optional(),
})

export type GetTweetSchema = z.infer<typeof getTweetSchema>

export type AITranslationSchema = (Omit<GetTweetSchema, 'tweetId'> & {
  tweet: EnrichedTweet
  type?: 'twitter'
}) | {
  /** IG caption AI 翻译 */
  type: 'ins'
  igPost: IGPost
  enableAITranslation: boolean
  apiKey: string
  model: string
  provider?: AIProviderName
  baseUrl?: string
  thinkingLevel?: string
  translationGlossary?: string
  force?: boolean
}
