/**
 * test/support/types.ts
 * Shared types for the AnonTweet API test client and integration layer.
 * （由 verify/sdk/types.ts 迁移，Phase A：清理无消费点的死类型）
 */

import type { TranslationEntity } from '../../app/types/index.js'

// ─── API Response shapes ──────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  error?: string
  status?: number
  message?: string
  cause?: unknown
  data?: T
}

export interface TweetApiResponse {
  tweetId: string
  entities: TranslationEntity[]
}

export interface IGTranslationResponse {
  captionTranslation: string
}

export interface AITestResponse {
  success: boolean
  provider: string
  model: string
  response?: string
  error?: string
  latencyMs?: number
}

// ─── Client config ────────────────────────────────────────

export interface ClientConfig {
  /** Base URL of the running app (default: http://localhost:9080) */
  baseUrl: string
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number
}
