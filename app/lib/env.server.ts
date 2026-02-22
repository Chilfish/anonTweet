import { z } from 'zod'
import 'dotenv/config'

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),

  TWEET_KEYS: z.string().min(1),

  DB_URL: z.url().optional(),
  ENABLE_DB_CACHE: z.stringbool().default(true),
  ENABLE_LOCAL_CACHE: z.stringbool().default(false),
  VERCEL: z.stringbool().default(false),

  HOSTNAME: z.url().default('https://anon-tweet.chilfish.top'),

  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional().default('models/gemini-3-flash-preview'),
  ENABLE_AI_TRANSLATION: z.stringbool().default(false),
})

/**
 * Validated server environment variables
 */
export const env = (() => {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (parsed.success === false) {
    console.error(
      '❌ Invalid environment variables:',
      z.treeifyError(parsed.error),
    )
    throw new Error('Invalid environment variables')
  }

  const validatedData = parsed.data
  Object.freeze(validatedData) // Ensure immutability

  // Only log in development for better production security
  if (validatedData.ENVIRONMENT === 'development') {
    console.log(`✅ Environment: ${validatedData.ENVIRONMENT}`)
  }

  return validatedData
})()
