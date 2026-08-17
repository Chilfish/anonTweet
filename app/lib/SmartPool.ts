import { FetcherService } from '~/lib/rettiwt-api'
import { RettiwtConfig } from '~/lib/rettiwt-api/models/RettiwtConfig'

// 定义业务函数的签名：接收一个 Fetcher，返回任意 Promise
type Task<T> = (fetcher: FetcherService) => Promise<T>

export interface RetryDecision {
  /** 是否值得重试（换 Key / 退避后再试） */
  retryable: boolean
  /** 是否对该 Key 施加冷却（429/401/403 均为配额/凭证失效，冷却避免热循环死 Key） */
  cooldown: boolean
}

export type RetryClassifier = (error: unknown) => RetryDecision | boolean

export interface RettiwtPoolOptions {
  /** 单次冷却时长 ms（默认 30s，Twitter 429 限流窗口典型值） */
  cooldownMs?: number
  /** 指数退避基数 ms（默认 1000）；单 Key 时退避 = min(cooldownMs, backoffMs * 2^failStreak) */
  backoffMs?: number
  /** 最大尝试次数（默认 max(3, keys.length * 2)），防止无限递归 */
  maxAttempts?: number
  /** 错误分类器，可注入自定义重试/冷却策略（默认按状态码 429/401/403） */
  shouldRetry?: RetryClassifier
  /** Fetcher 工厂注入（测试用 mock；默认按 Key 懒建真实实例） */
  createFetcher?: (key?: string) => FetcherService
}

interface KeyState {
  /** 冷却截止时间戳（Date.now()），期间该 Key 不参与轮询 */
  cooldownUntil: number
  /** 连续失败次数，驱动指数退避 */
  failStreak: number
  /** 进行中请求数，用于负载均衡与并发隔离 */
  inFlight: number
}

const NO_KEY = '__NO_API_KEY__'

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null)
    return undefined
  const e = error as Record<string, unknown>
  const nested = typeof e.response === 'object' && e.response !== null
    ? e.response as Record<string, unknown>
    : undefined
  for (const v of [nested?.status, e.status, e.statusCode]) {
    if (typeof v === 'number')
      return v
  }
  return undefined
}

/** 默认错误分类：429 (Rate Limit) / 401 (凭证失效) / 403 (Forbidden) 均可重试并进入冷却 */
const defaultClassifier: RetryClassifier = (error) => {
  const status = errorStatus(error)
  return status === 429 || status === 401 || status === 403
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)))
}

/**
 * Twitter 多 Key 轮询池（review P1-1 重构）：
 *
 * - **per-key 冷却**：429/401/403 后该 Key 进入 `cooldownUntil`，冷却期内不参与轮询
 * - **指数退避**：单 Key（无 TWEET_KEYS）时按 failStreak 退避重试，而非立刻抛错
 * - **失败隔离**：per-key `failStreak` / `inFlight` 状态；耗尽时聚合各 Key 状态抛错
 * - **可测性**：`shouldRetry` 分类器与 `createFetcher` 工厂可注入（test/unit/smart-pool.spec.ts）
 */
export class RettiwtPool {
  private keys: Array<string | undefined>
  private readonly hasApiKeys: boolean
  private readonly opts: Pick<RettiwtPoolOptions, 'createFetcher'> & Required<Pick<RettiwtPoolOptions, 'cooldownMs' | 'backoffMs' | 'maxAttempts' | 'shouldRetry'>>
  private keyStates = new Map<string, KeyState>()
  private currentIndex = 0
  private instanceCache = new Map<string, FetcherService>()

  constructor(keys: string[], options: RettiwtPoolOptions = {}) {
    const sanitized = keys.map(k => k.trim()).filter(Boolean)
    this.hasApiKeys = sanitized.length > 0
    this.keys = this.hasApiKeys ? sanitized : [undefined]
    this.opts = {
      cooldownMs: options.cooldownMs ?? 30_000,
      backoffMs: options.backoffMs ?? 1_000,
      maxAttempts: Math.max(3, options.maxAttempts ?? this.keys.length * 2),
      shouldRetry: options.shouldRetry ?? defaultClassifier,
      createFetcher: options.createFetcher,
    }
    for (const k of this.keys)
      this.keyStates.set(k ?? NO_KEY, { cooldownUntil: 0, failStreak: 0, inFlight: 0 })
  }

  /**
   * 核心高阶函数：预留可用 Key → 执行业务 → 失败时按分类器冷却/轮换/退避重试。
   * @param task 具体的业务逻辑，例如：(fetcher) => fetcher.request(...)
   * @param attempt 当前第几次尝试（内部递归使用）
   */
  public async run<T>(task: Task<T>, attempt: number = 0): Promise<T> {
    const { key, fetcher } = this.reserveKey()
    const state = this.getState(key)
    state.inFlight += 1

    try {
      const result = await task(fetcher)
      state.failStreak = 0
      state.inFlight -= 1
      return result
    }
    catch (error: unknown) {
      state.inFlight -= 1
      return this.onFailure(task, error, attempt, key)
    }
  }

  private async onFailure<T>(task: Task<T>, error: unknown, attempt: number, key: string | undefined): Promise<T> {
    const state = this.getState(key)
    const decision = this.toDecision(this.opts.shouldRetry(error))

    if (!decision.retryable)
      throw error

    if (attempt + 1 >= this.opts.maxAttempts)
      throw this.buildExhaustedError(attempt, error)

    // 施加冷却 + 指数退避（failStreak 计数 → 退避时长，封顶 cooldownMs）
    state.failStreak += 1
    if (decision.cooldown) {
      state.cooldownUntil = Date.now()
        + Math.min(this.opts.cooldownMs, this.opts.backoffMs * 2 ** Math.min(state.failStreak - 1, 6))
    }

    this.warnRotation(key, error)

    // 等下一个可用 Key（含冷却解除时间），再递归重试
    await sleep(this.delayUntilAvailable())
    return this.run(task, attempt + 1)
  }

  /** 轮询选择一个可用 Key：优先空载（inFlight=0）且未冷却；全部冷却则选最早解除者 */
  private reserveKey(): { key: string | undefined, fetcher: FetcherService } {
    const now = Date.now()
    const candidates: Array<{ key: string | undefined, state: KeyState }> = []

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length
      const key = this.keys[idx]!
      if (this.getState(key).cooldownUntil <= now)
        candidates.push({ key, state: this.getState(key) })
    }

    let chosen: { key: string | undefined, state: KeyState }
    if (candidates.length > 0) {
      chosen = candidates.find(c => c.state.inFlight === 0) ?? candidates[0]!
    }
    else {
      // 全部在冷却：选最早解除冷却的 Key，调用方 sleep 到解除时刻
      chosen = this.keys
        .map(key => ({ key, state: this.getState(key) }))
        .sort((a, b) => a.state.cooldownUntil - b.state.cooldownUntil)[0]!
    }

    this.currentIndex = (this.keys.indexOf(chosen.key) + 1) % this.keys.length
    return { key: chosen.key, fetcher: this.getOrCreateFetcher(chosen.key) }
  }

  /** 距下一个可用 Key 的最短等待：仍有可用 Key 则 0；全部冷却则等最早解除者 */
  private delayUntilAvailable(): number {
    const now = Date.now()
    const anyAvailable = this.keys.some(k => this.getState(k).cooldownUntil <= now)
    if (anyAvailable)
      return 0
    const earliest = this.keys.reduce(
      (min, k) => Math.min(min, this.getState(k).cooldownUntil),
      Number.POSITIVE_INFINITY,
    )
    return earliest === Number.POSITIVE_INFINITY ? 0 : earliest - now
  }

  private getState(key: string | undefined): KeyState {
    return this.keyStates.get(key ?? NO_KEY)!
  }

  private getOrCreateFetcher(key: string | undefined): FetcherService {
    const cacheKey = key ?? NO_KEY
    let fetcher = this.instanceCache.get(cacheKey)
    if (!fetcher) {
      fetcher = this.opts.createFetcher
        ? this.opts.createFetcher(key)
        : new FetcherService(new RettiwtConfig({
            apiKey: this.hasApiKeys ? key : undefined,
            proxyUrl: typeof process !== 'undefined' && !!process.env.http_proxy
              ? new URL(process.env.http_proxy)
              : undefined,
          }))
      this.instanceCache.set(cacheKey, fetcher)
    }
    return fetcher
  }

  private toDecision(d: RetryDecision | boolean): RetryDecision {
    return typeof d === 'boolean' ? { retryable: d, cooldown: d } : d
  }

  private warnRotation(key: string | undefined, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    const suffix = key ? `Key ending in ...${key.slice(-10)} hit rate limit/credential error` : 'Hit rate limit/credential error'
    console.warn(`[RettiwtPool] ${suffix} (${message}). Cooling down & rotating...`)
  }

  private buildExhaustedError(attempt: number, lastError: unknown): Error {
    const summary = this.keys.map((k) => {
      const s = this.getState(k)
      const label = k ? `...${k.slice(-6)}` : 'NO_KEY'
      const cooldownLeft = Math.max(0, s.cooldownUntil - Date.now())
      return `${label}: streak=${s.failStreak}, cooldownLeft=${cooldownLeft}ms`
    }).join('; ')
    const message = lastError instanceof Error ? lastError.message : String(lastError)
    return new Error(`[RettiwtPool] All keys exhausted after ${attempt + 1} attempts. Last error: ${message}. States: ${summary}`)
  }
}
