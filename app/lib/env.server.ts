import { z } from 'zod'
import 'dotenv/config'

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),

  // Optional: without keys it may still work, but will face stricter upstream rate limits.
  TWEET_KEYS: z.string().optional().default(''),

  DB_URL: z.url().optional(),
  ENABLE_DB_CACHE: z.stringbool().default(false),
  ENABLE_LOCAL_CACHE: z.stringbool().default(false),
  VERCEL: z.stringbool().default(false),

  // Optional: required only for server-side callbacks that need an absolute URL (e.g. screenshot/plain route).
  // In development, we'll default to http://localhost:<PORT> when absent.
  HOSTNAME: z.url().optional(),

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

  const validatedData = parsed.data as z.infer<typeof serverEnvSchema> & { HOSTNAME?: string }

  if (!validatedData.HOSTNAME && validatedData.ENVIRONMENT === 'development') {
    const port = Number.parseInt(process.env.PORT || '9080')
    validatedData.HOSTNAME = `http://localhost:${Number.isFinite(port) ? port : 9080}`
  }

  if (!validatedData.TWEET_KEYS && validatedData.ENVIRONMENT === 'production') {
    console.warn('⚠️  TWEET_KEYS is empty. Upstream fetching may be rate-limited in production.')
  }

  Object.freeze(validatedData) // Ensure immutability

  // Only log in development for better production security
  const isTestRuntime = process.env.NODE_ENV === 'test' || !!process.env.VITEST
  if (validatedData.ENVIRONMENT === 'development' && !isTestRuntime) {
    console.log(`✅ Environment: ${validatedData.ENVIRONMENT}`)
  }

  return validatedData
})()
