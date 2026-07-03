/**
 * verify/sdk/types.ts
 * Shared types for the AnonTweet API test client and verifier framework.
 */

import type { EnrichedTweet, IGPost, TranslationEntity } from '../../app/types/index.js'

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

export interface TweetListResponse {
  tweets: EnrichedTweet[]
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

// ─── API method signatures ────────────────────────────────

export interface TweetApi {
  /** POST /api/tweet/get — fetch tweet with optional AI translation */
  get: (params: {
    tweetId: string
    enableAITranslation?: boolean
    apiKey?: string
    model?: string
    force?: boolean
  }) => Promise<EnrichedTweet[]>

  /** GET /api/tweet/:id — simple loader-based fetch */
  getById: (id: string) => Promise<EnrichedTweet[]>

  /** POST /api/tweet/list?ids=... — batch fetch (if implemented) */
  list: (ids: string[]) => Promise<EnrichedTweet[]>
}

export interface IGApi {
  /** POST /api/ig/:id — fetch IG post with optional AI translation */
  get: (params: {
    igId: string
    enableAITranslation?: boolean
    apiKey?: string
    model?: string
    force?: boolean
  }) => Promise<IGPost[]>

  /** GET /api/ig/:id — simple loader-based fetch */
  getById: (id: string) => Promise<IGPost[]>
}

export interface AIApi {
  /** POST /api/ai/ai-translation — unified AI translation */
  translateTweet: (params: {
    tweet: EnrichedTweet
    enableAITranslation: boolean
    apiKey: string
    model: string
    force?: boolean
  }) => Promise<ApiResponse<TweetApiResponse>>

  /** POST /api/ai/ai-translation — IG caption translation */
  translateIG: (params: {
    igPost: IGPost
    enableAITranslation: boolean
    apiKey: string
    model: string
    force?: boolean
  }) => Promise<ApiResponse<IGTranslationResponse>>

  /** POST /api/ai/ai-test — provider connectivity test */
  test: (params: {
    apiKey: string
    model: string
    provider?: string
  }) => Promise<ApiResponse<AITestResponse>>
}

export interface UserApi {
  /** GET /api/user/:id — fetch user details */
  get: (id: string) => Promise<unknown>
}

// ─── Server lifecycle ─────────────────────────────────────

export interface ServerProcess {
  /** Start the dev server */
  start: () => Promise<void>
  /** Stop the server */
  stop: () => Promise<void>
  /** Check if server is ready to accept requests */
  waitForReady: (timeoutMs?: number) => Promise<boolean>
}
