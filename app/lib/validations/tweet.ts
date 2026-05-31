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

export const getTweetSchema = z.object({
  tweetId: z.string().min(1),
  enableAITranslation: z.boolean().default(false),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  thinkingLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional(),
  translationGlossary: z.string().optional(),
  force: z.boolean().default(false),
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
  thinkingLevel?: string
  translationGlossary?: string
  force?: boolean
}
