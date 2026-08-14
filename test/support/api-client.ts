/**
 * test/support/api-client.ts
 *
 * Programmatic HTTP client for AnonTweet's BFF API endpoints.
 * Designed for use by the integration test layer.
 * No browser required — uses standard `fetch` (Bun/Node 18+).
 * （由 verify/sdk/api-client.ts 迁移，Phase A）
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

  /**
   * Low-level GET that never throws on non-2xx, exposing the raw status.
   * Used by verifiers that must assert error codes (400/403/etc).
   */
  private async rawGet(path: string): Promise<{ status: number, contentType: string | null }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        signal: controller.signal,
      })
      // Drain the body so the connection is reusable, even on error responses.
      await res.text()
      return {
        status: res.status,
        contentType: res.headers.get('Content-Type'),
      }
    }
    finally {
      clearTimeout(timer)
    }
  }

  /**
   * Low-level POST that never throws on non-2xx, exposing the raw status + body text.
   * Used by verifiers that must assert error codes (500/etc) with response content.
   */
  private async rawPost(path: string, body: unknown): Promise<{ status: number, bodyText: string }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const bodyText = await res.text()
      return { status: res.status, bodyText }
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
    /** POST /api/ig/get/:id — fetch IG post with optional AI translation */
    get: async (params: {
      igId: string
      enableAITranslation?: boolean
      apiKey?: string
      model?: string
      force?: boolean
    }): Promise<IGPost[]> => {
      return this.post<IGPost[]>(`/api/ig/get/${params.igId}`, params)
    },

    /** GET /api/ig/get/:id — loader-based fetch (no translation) */
    getById: async (id: string): Promise<IGPost[]> => {
      return this.get<IGPost[]>(`/api/ig/get/${id}`)
    },

    /**
     * POST /api/ig/get/:id — raw status + body text for integration assertions
     * (e.g. 500 when INS_COOKIES is unset, 404 on parse failure).
     */
    postRaw: async (id: string, body?: Record<string, unknown>): Promise<{ status: number, bodyText: string }> => {
      return this.rawPost(`/api/ig/get/${id}`, body ?? {})
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

  // ── Screenshot plain routes ─────────────────────────────

  readonly plain = {
    /** GET /plain-tweet/:id — Tweet screenshot page (HTML) */
    tweet: async (id: string): Promise<string> => {
      return this.get<string>(`/plain-tweet/${encodeURIComponent(id)}`)
    },

    /** GET /plain-ins/:id — IG screenshot page (HTML) */
    ig: async (id: string): Promise<string> => {
      return this.get<string>(`/plain-ins/${encodeURIComponent(id)}`)
    },
  }

  // ── Media proxy ─────────────────────────────────────────

  readonly proxy = {
    /**
     * GET /api/proxy/image?url=... — proxy a remote image.
     * Returns the raw status + content-type so verifiers can assert both the
     * happy path (200 + image/*) and error paths (400/403).
     */
    image: async (url: string): Promise<{ status: number, contentType: string | null }> => {
      return this.rawGet(`/api/proxy/image?url=${encodeURIComponent(url)}`)
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
