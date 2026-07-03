/**
 * verify/sdk/api-client.ts
 *
 * Programmatic HTTP client for AnonTweet's BFF API endpoints.
 * Designed for use by CLI verification tools and CI pipelines.
 * No browser required — uses standard `fetch` (Bun/Node 18+).
 */

import type {
  AITestResponse,
  ApiResponse,
  ClientConfig,
  IGTranslationResponse,
  TweetApiResponse,
} from './types.js'
import type { EnrichedTweet, IGPost } from '~/types'

// ─── Defaults ────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'http://localhost:9080'
const DEFAULT_TIMEOUT_MS = 30_000

// ─── Client ───────────────────────────────────────────────────

export class AnonTweetClient {
  private config: Required<ClientConfig>

  constructor(config: ClientConfig = { baseUrl: DEFAULT_BASE_URL }) {
    this.config = {
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    }
  }

  // ── Low-level ──────────────────────────────────────────

  private async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const text = await res.text()
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 200)}`)
      }

      try {
        return JSON.parse(text) as T
      }
      catch {
        // React Router returns arrays directly for some loaders
        return text as unknown as T
      }
    }
    finally {
      clearTimeout(timer)
    }
  }

  private async get<T = unknown>(path: string): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        signal: controller.signal,
      })

      const text = await res.text()
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${path}: ${text.slice(0, 200)}`)
      }

      try {
        return JSON.parse(text) as T
      }
      catch {
        return text as unknown as T
      }
    }
    finally {
      clearTimeout(timer)
    }
  }

  // ── Tweet API ──────────────────────────────────────────

  readonly tweet = {
    /** POST /api/tweet/get — fetch tweet with optional AI translation */
    get: async (params: {
      tweetId: string
      enableAITranslation?: boolean
      apiKey?: string
      model?: string
      force?: boolean
    }): Promise<EnrichedTweet[]> => {
      return this.post<EnrichedTweet[]>('/api/tweet/get', params)
    },

    /** GET /api/tweet/:id — loader-based fetch (no translation) */
    getById: async (id: string): Promise<EnrichedTweet[]> => {
      return this.get<EnrichedTweet[]>(`/api/tweet/${id}`)
    },

    /** POST /api/tweet/list — batch fetch */
    list: async (ids: string[]): Promise<EnrichedTweet[]> => {
      return this.post<EnrichedTweet[]>('/api/tweet/list', { ids })
    },

    /** GET /api/tweet/:id/replies */
    replies: async (tweetId: string): Promise<EnrichedTweet[]> => {
      return this.get<EnrichedTweet[]>(`/api/tweet/${tweetId}/replies`)
    },
  }

  // ── Instagram API ──────────────────────────────────────

  readonly ig = {
    /** POST /api/ig/:id — fetch IG post with optional AI translation */
    get: async (params: {
      igId: string
      enableAITranslation?: boolean
      apiKey?: string
      model?: string
      force?: boolean
    }): Promise<IGPost[]> => {
      return this.post<IGPost[]>(`/api/ig/${params.igId}`, params)
    },

    /** GET /api/ig/:id — loader-based fetch (no translation) */
    getById: async (id: string): Promise<IGPost[]> => {
      return this.get<IGPost[]>(`/api/ig/${id}`)
    },
  }

  // ── AI API ─────────────────────────────────────────────

  readonly ai = {
    /** POST /api/ai/ai-translation — translate tweet entities */
    translateTweet: async (params: {
      tweet: EnrichedTweet
      enableAITranslation: boolean
      apiKey: string
      model: string
      force?: boolean
    }): Promise<ApiResponse<TweetApiResponse>> => {
      return this.post<ApiResponse<TweetApiResponse>>('/api/ai/ai-translation', {
        ...params,
        type: 'twitter',
      })
    },

    /** POST /api/ai/ai-translation — translate IG caption */
    translateIG: async (params: {
      igPost: IGPost
      enableAITranslation: boolean
      apiKey: string
      model: string
      force?: boolean
    }): Promise<ApiResponse<IGTranslationResponse>> => {
      return this.post<ApiResponse<IGTranslationResponse>>('/api/ai/ai-translation', {
        ...params,
        type: 'ins',
      })
    },

    /** POST /api/ai/ai-test — provider connectivity test */
    test: async (params: {
      apiKey: string
      model: string
      provider?: string
    }): Promise<ApiResponse<AITestResponse>> => {
      return this.post<ApiResponse<AITestResponse>>('/api/ai/ai-test', params)
    },
  }

  // ── User API ───────────────────────────────────────────

  readonly user = {
    /** GET /api/user/:id */
    get: async (id: string): Promise<unknown> => {
      return this.get<unknown>(`/api/user/${id}`)
    },

    /** GET /api/user/:id/timeline */
    timeline: async (id: string): Promise<EnrichedTweet[]> => {
      return this.get<EnrichedTweet[]>(`/api/user/${id}/timeline`)
    },
  }

  // ── Health check ───────────────────────────────────────

  /** Check if the server is reachable. Returns true if the app responds. */
  async health(): Promise<boolean> {
    try {
      await this.get('/')
      return true
    }
    catch {
      return false
    }
  }
}
