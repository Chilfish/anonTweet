import type { FetcherService } from '~/lib/rettiwt-api'
import { describe, expect, it, vi } from 'vitest'
import { RettiwtPool } from '~/lib/SmartPool'

const ALL_KEYS_EXHAUSTED_RE = /All keys exhausted/
const FORBIDDEN_RE = /forbidden/

/**
 * test/unit/smart-pool.spec.ts
 *
 * RettiwtPool 限流/冷却/失败隔离重构单测（review P1-1 / backlog 阶段一任务 2，≥6 用例）。
 * 通过 createFetcher 注入 mock Fetcher（构造路径与真实网络隔离）。
 */

interface MockFetcher {
  request: (a?: unknown, b?: unknown) => unknown
}

/** 构造一个按行为抛错/成功的 mock Fetcher */
function httpError(status: number, message: string): Error {
  const e = new Error(message)
  ;(e as { status?: number }).status = status
  return e
}

/** 构造一个按行为抛错/成功的 mock Fetcher */
function mockFetcher(behavior: () => unknown): MockFetcher {
  // request 需满足 FetcherService.request 的双参签名（测试侧第二个参数无意义）
  return { request: vi.fn((_a?: unknown, _b?: unknown) => behavior()) }
}

/** 构造一个恒失败（给定 status）的 mock Fetcher 工厂 */
function throwingFetcher(status: number): (key?: string) => FetcherService {
  const err = (): never => {
    const e = new Error(`HTTP ${status}`)
    ;(e as { status?: number }).status = status
    throw e
  }
  return () => mockFetcher(err) as unknown as FetcherService
}

/** 测试用 fetch 任务：绕开 FetcherService.request 的 ResourceType 签名，直接打 mock */
const fetch = async (fetcher: FetcherService) => (fetcher as unknown as MockFetcher).request('x', {})

describe('rettiwtPool', () => {
  it('runs the task with the single key and returns the result', async () => {
    const f = mockFetcher(() => 'ok')
    const pool = new RettiwtPool(['key-1'], { createFetcher: () => f as unknown as FetcherService })

    await expect(pool.run(fetch)).resolves.toBe('ok')
    expect(f.request).toHaveBeenCalledTimes(1)
  })

  it('rotates to the next key on 429 and succeeds', async () => {
    const wrong = mockFetcher(() => {
      throw httpError(429, 'rate limited')
    })
    const good = mockFetcher(() => 'good')
    const created: MockFetcher[] = [wrong, good]
    const pool = new RettiwtPool(['key-1', 'key-2'], {
      cooldownMs: 100,
      backoffMs: 1,
      createFetcher: () => created.shift()! as unknown as FetcherService,
    })

    await expect(pool.run(fetch)).resolves.toBe('good')
    expect(wrong.request).toHaveBeenCalledTimes(1)
    expect(good.request).toHaveBeenCalledTimes(1)
  })

  it('cooldowns the failing key and skips it on a subsequent independent run', async () => {
    const always429 = mockFetcher(() => {
      throw httpError(429, 'rate limited')
    })
    const good = mockFetcher(() => 'ok')
    const pool = new RettiwtPool(['bad', 'good'], {
      cooldownMs: 1_000_000, // 冷却期足够长（backoffMs 同步放大，避免 min() 被基数裁短），第二次 run 不会再用 bad
      backoffMs: 1_000_000,
      createFetcher: key => (key === 'bad' ? always429 : good) as unknown as FetcherService,
    })

    await expect(pool.run(fetch)).resolves.toBe('ok') // bad 429 → 轮换到 good
    expect(always429.request).toHaveBeenCalledTimes(1)
    // 第二个独立请求：bad 仍在冷却 → 直接走 good
    await expect(pool.run(fetch)).resolves.toBe('ok')
    expect(always429.request).toHaveBeenCalledTimes(1) // bad 未被再次使用
  })

  it('throws aggregated exhaustion error after maxAttempts when all keys fail', async () => {
    const pool = new RettiwtPool(['a', 'b'], {
      cooldownMs: 10,
      backoffMs: 1,
      maxAttempts: 3,
      createFetcher: throwingFetcher(429),
    })

    await expect(pool.run(fetch)).rejects.toThrow(ALL_KEYS_EXHAUSTED_RE)
  })

  it('propagates non-retryable errors without retry (HTTP 500 / generic Error)', async () => {
    const err = new Error('boom')
    const f = mockFetcher(() => {
      throw err
    })
    const pool = new RettiwtPool(['a', 'b'], {
      createFetcher: () => f as unknown as FetcherService,
    })

    await expect(pool.run(fetch)).rejects.toBe(err)
    expect(f.request).toHaveBeenCalledTimes(1)
  })

  it('single key applies exponential backoff and retries until maxAttempts, then throws', async () => {
    const f = mockFetcher(() => {
      throw httpError(429, 'rate limited')
    })
    const pool = new RettiwtPool(['only'], {
      cooldownMs: 10_000, // 退避时长被 min() 封顶到 cooldownMs，加速测试
      backoffMs: 1,
      maxAttempts: 3,
      createFetcher: () => f as unknown as FetcherService,
    })

    await expect(pool.run(fetch)).rejects.toThrow(ALL_KEYS_EXHAUSTED_RE)
    expect(f.request).toHaveBeenCalledTimes(3) // 初始 1 次 + 2 次退避重试
  })

  it('honors a custom classifier (only 429 retryable, 403 throws immediately)', async () => {
    const f = mockFetcher(() => {
      throw httpError(403, 'forbidden')
    })
    const pool = new RettiwtPool(['a', 'b'], {
      createFetcher: () => f as unknown as FetcherService,
      shouldRetry: error => (error as { status?: number }).status === 429,
    })

    await expect(pool.run(fetch)).rejects.toThrow(FORBIDDEN_RE)
    expect(f.request).toHaveBeenCalledTimes(1)
  })

  it('prefers the idle key over a busy one for load balancing', async () => {
    const order: string[] = []
    const pool = new RettiwtPool(['a', 'b'], {
      createFetcher: key => mockFetcher(() => {
        order.push(key!)
        return 'ok'
      }) as unknown as FetcherService,
    })

    // 并发两个请求：第一个占用 a，第二个轮询时 a inFlight>0 → 用 b
    const [r1, r2] = await Promise.all([
      pool.run(fetch),
      pool.run(fetch),
    ])
    expect(r1).toBe('ok')
    expect(r2).toBe('ok')
    expect(order).toEqual(expect.arrayContaining(['a', 'b']))
  })
})
