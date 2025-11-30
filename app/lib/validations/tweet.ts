import { z } from 'zod'

export const tweetIdSchema = z.string().transform(val => Number(val))

export const tweetSchema = z.discriminatedUnion('intent', [
  z.object({
    intent: z.literal('update'),
    tweet: z.string(),
  }),
  z.object({
    intent: z.literal('create'),
    tweet: z.string(),
  }),
])
