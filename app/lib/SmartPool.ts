import { FetcherService } from '~/lib/rettiwt-api'
import { RettiwtConfig } from '~/lib/rettiwt-api/models/RettiwtConfig'

// 定义业务函数的签名：接收一个 Fetcher，返回任意 Promise
type Task<T> = (fetcher: FetcherService) => Promise<T>

export class RettiwtPool {
  private keys: string[]
  private currentIndex: number = 0
  // 缓存实例，避免重复 new Config 的开销
  private instanceCache: Map<string, FetcherService> = new Map()

  constructor(keys: string[]) {
    if (!keys.length)
      throw new Error('API Keys cannot be empty')
    this.keys = keys
  }

  /**
   * 核心高阶函数
   * @param task 具体的业务逻辑，例如：(fetcher) => fetcher.request(...)
   * @param attempt 当前重试次数（内部使用）
   */
  public async run<T>(task: Task<T>, attempt: number = 0): Promise<T> {
    // 1. 获取当前 Key 和对应的 Fetcher 实例
    const currentKey = this.getKey()
    const fetcher = this.getOrCreateFetcher(currentKey)

    try {
      // 2. 执行业务逻辑
      return await task(fetcher)
    }
    catch (error: any) {
      // 3. 错误过滤：判断是否值得重试
      if (this.shouldRetry(error)) {
        // 防止无限递归：如果重试次数超过 Key 的总数，说明所有 Key 都挂了，直接抛出
        if (attempt >= this.keys.length) {
          throw new Error(`[RettiwtPool] All keys exhausted via Rate Limiting. Last Error: ${error.message}`)
        }

        console.warn(`[RettiwtPool] Key ending in ...${currentKey.slice(-10)} hit 429. Rotating...`)

        // 4. 轮询到下一个 Key
        this.rotateKey()

        // 5. 递归重试
        return this.run(task, attempt + 1)
      }

      // 如果不是 429，或者是 404/401/500，直接抛出，不要换 Key 重试
      throw error
    }
  }

  private getKey(): string {
    return this.keys[this.currentIndex]!
  }

  private rotateKey(): void {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length
  }

  private getOrCreateFetcher(key: string): FetcherService {
    if (!this.instanceCache.has(key)) {
      const config = new RettiwtConfig({ apiKey: key })
      this.instanceCache.set(key, new FetcherService(config))
    }
    return this.instanceCache.get(key)!
  }

  /**
   * 策略判断：定义什么错误需要换 Key
   * 这里你需要根据实际库抛出的 Error 结构进行调整
   */
  private shouldRetry(error: any): boolean {
    const status = error?.response?.status || error?.status || error?.statusCode
    return status === 429
  }
}
