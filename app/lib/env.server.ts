import { z } from 'zod'
import 'dotenv/config'

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),

  TWEET_KEY: z.string().min(1),

  S3_ENDPOINT: z.url().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  S3_PUBLIC_URL: z.url().min(1),

  // Better Auth
  BETTER_AUTH_URL: z.url().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),

  DB_URL: z.url().optional(),
  ENABLE_DB_CACHE: z.stringbool().default(true),
  VERCEL: z.stringbool().default(false),
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

// Environment convenience exports
export const isDevelopment = env.ENVIRONMENT === 'development'
export const isProduction = env.ENVIRONMENT === 'production'

/**
 * Returns a subset of environment variables that are safe to expose to the client.
 * SECURITY WARNING: Be careful what you expose here - never include API keys,
 * secrets, or sensitive information as these will be visible in the browser.
 */
export function getPublicEnv() {
  return {
    // Add other public variables here that are safe to expose...
  }
}

export type PublicEnv = ReturnType<typeof getPublicEnv>
