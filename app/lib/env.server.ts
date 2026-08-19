import dotenv from 'dotenv'
import { z } from 'zod'

// 测试环境用 DOTENV_CONFIG_PATH 指向不存在的文件，避免加载真实 .env（否则 override 会覆盖测试注入的 env）
dotenv.config({ override: true, path: process.env.DOTENV_CONFIG_PATH, quiet: true })

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),

  // Optional: without keys it may still work, but will face stricter upstream rate limits.
  TWEET_KEYS: z.string().optional().default(''),

  // Instagram — cookies for gallery-dl-instagram SDK
  INS_COOKIES: z.string().optional(),

  DB_URL: z.url().optional(),
  ENABLE_DB_CACHE: z.stringbool().default(false),
  ENABLE_LOCAL_CACHE: z.stringbool().default(false),
  VERCEL: z.stringbool().default(false),

  // Optional: required only for server-side callbacks that need an absolute URL (e.g. screenshot/plain route).
  // In development, we'll default to http://localhost:<PORT> when absent.
  HOSTNAME: z.url().optional(),

  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional().default('models/gemini-3-flash-preview'),
  ENABLE_AI_TRANSLATION: z.stringbool().default(false),
  // 隐藏自用入口开关（Bili 动态发布代理）：默认开启（自用入口始终可用），不宣传、不扩展，
  // 见 docs/planning/project-architecture.md §2.5 已知限制
  ENABLE_BILI: z.stringbool().default(true),
  // 可选安全加固：AI baseUrl 白名单校验（默认关闭——第三方中转站/自建端点直接可用；
  // 公开部署可设 true 开启，配合 ALLOWED_AI_BASE_URL_HOSTS 扩展白名单域名）
  ENABLE_AI_BASE_URL_WHITELIST: z.stringbool().default(false),
  // 白名单额外域名（逗号分隔，仅当 ENABLE_AI_BASE_URL_WHITELIST=true 时生效；
  // 与内置官方域名合并校验）
  ALLOWED_AI_BASE_URL_HOSTS: z.string().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema> & { HOSTNAME?: string }

/**
 * 纯函数：从给定的 env 源（默认 process.env）校验并构建环境对象。
 * 抽离为纯函数以便测试注入合成 env（无需 vi.resetModules，vitest / bun 原生 runner 双兼容），
 * 且符合 postmortem #002「纯逻辑下沉 lib + 单测」规范。dotenv 副作用仍只在模块加载时执行一次。
 */
export function createEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source)

  if (parsed.success === false) {
    console.error(
      '❌ Invalid environment variables:',
      z.treeifyError(parsed.error),
    )
    throw new Error('Invalid environment variables')
  }

  const validatedData = parsed.data as ServerEnv

  if (!validatedData.HOSTNAME && validatedData.ENVIRONMENT === 'development') {
    const port = Number.parseInt(source.PORT || '9080')
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
}

/**
 * Validated server environment variables
 */
export const env: ServerEnv = createEnv()
