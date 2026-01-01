import type { TranslationEntity } from '~/types'
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
