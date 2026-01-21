import { env } from './env.server'

export type CacheType = 'tweet' | 'user' | 'replies'

/**
 * 缓存数据包装结构，用于存储过期时间
 */
interface CacheWrapper<T> {
  data: T
  expiresAt: number | null // null 表示永不过期
}

/**
 * 核心缓存适配器接口
 */
interface ICacheAdapter {
  name: string
  /**
   * 获取缓存
   * @returns 如果未找到或已过期，返回 null
   */
  get: <T>(key: string) => Promise<T | null>

  /**
   * 设置缓存
   * @param ttl 毫秒数
   */
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>
}

export interface CacheArgs<T> {
  id: string
  getter: () => Promise<T>
  type: CacheType
  /**
   * 缓存有效时间 (毫秒)。
   * 默认策略：如果不传，默认缓存 1 小时 (3600000ms)，可视业务需求调整
   */
  ttl?: number
}

/**
 * 内存缓存适配器 - 实现简易 LRU 策略防止内存泄漏
 */
class MemoryCacheAdapter implements ICacheAdapter {
  name = 'Memory(LRU)'
  // 使用 Map 模拟 LRU，JS 的 Map 保持插入顺序
  private cache = new Map<string, CacheWrapper<any>>()
  private readonly MAX_SIZE = 1000 // 最大缓存条目限制

  async get<T>(key: string): Promise<T | null> {
    const wrapper = this.cache.get(key)
    if (!wrapper)
      return null

    // 1. 检查过期
    if (wrapper.expiresAt && Date.now() > wrapper.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // 2. LRU 刷新：读取时先删除再重新 set，将其移到 Map 末尾（表示最近使用）
    this.cache.delete(key)
    this.cache.set(key, wrapper)

    // 注意：这里做一次深拷贝，防止外部修改缓存内的对象引用
    // 对于高性能场景，可以不做 parse/stringify，但需确保数据不可变
    return JSON.parse(JSON.stringify(wrapper.data))
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // 1. 容量检查 (Eviction Policy)
    if (this.cache.size >= this.MAX_SIZE) {
      // Map.keys().next().value 获取第一个插入的键（即最久未使用的）
      const oldestKey = this.cache.keys().next().value
      if (oldestKey)
        this.cache.delete(oldestKey)
    }

    const expiresAt = ttl ? Date.now() + ttl : null

    // 存储前序列化再反序列化，确保存入的是快照
    const safeData = JSON.parse(JSON.stringify(value))

    this.cache.set(key, { data: safeData, expiresAt })
  }
}

/**
 * 文件系统缓存适配器 - 支持原子写入与持久化 TTL
 */
class NodeFsCacheAdapter implements ICacheAdapter {
  name = 'NodeFS'
  private dir = 'cache'
  // 动态导入的模块引用
  private fs: typeof import('node:fs/promises') | null = null
  private path: typeof import('node:path') | null = null

  private async init() {
    if (this.fs)
      return
    this.fs = await import('node:fs/promises')
    this.path = await import('node:path')
    try {
      await this.fs.access(this.dir).catch(() => this.fs!.mkdir(this.dir, { recursive: true }))
    }
    catch {}
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init()
    if (!this.fs || !this.path)
      return null

    const filePath = this.path.join(this.dir, `${key}.json`)

    try {
      const content = await this.fs.readFile(filePath, 'utf-8')
      const wrapper = JSON.parse(content) as CacheWrapper<T>

      // 检查过期时间
      if (wrapper.expiresAt && Date.now() > wrapper.expiresAt) {
        // 惰性删除：发现过期时尝试删除文件（不await，不阻塞返回）
        this.fs.unlink(filePath).catch(() => {})
        return null
      }

      return wrapper.data
    }
    catch (e: any) {
      // 文件不存在或 JSON 损坏
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.init()
    if (!this.fs || !this.path)
      return

    const filePath = this.path.join(this.dir, `${key}.json`)
    const tempPath = `${filePath}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`
    const expiresAt = ttl ? Date.now() + ttl : null

    const wrapper: CacheWrapper<T> = {
      data: value,
      expiresAt,
    }

    try {
      // 原子写入：Write to Temp -> Rename
      await this.fs.writeFile(tempPath, JSON.stringify(wrapper), 'utf-8')
      await this.fs.rename(tempPath, filePath)
    }
    catch (e) {
      console.error(`[Cache] Write failed for ${key}`, e)
      // 尝试清理临时文件
      this.fs.unlink(tempPath).catch(() => {})
    }
  }
}

// 单例持有
let adapterInstance: ICacheAdapter | null = null
// 请求合并队列
const pendingRequests = new Map<string, Promise<any>>()

/**
 * 适配器工厂：根据环境选择最佳策略
 */
async function getAdapter(): Promise<ICacheAdapter> {
  if (adapterInstance)
    return adapterInstance

  // 这里的检测逻辑可以根据你的实际部署环境微调
  const isNodeRuntime = typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null

  if (isNodeRuntime) {
    try {
      const adapter = new NodeFsCacheAdapter()
      // 简单探测，触发 init 里的 import，如果环境不支持 fs 会抛错
      await (adapter as any).init()
      adapterInstance = adapter
      return adapter
    }
    catch (e) {
      // console.warn('FS adapter init failed, falling back to Memory', e)
    }
  }

  adapterInstance = new MemoryCacheAdapter()
  return adapterInstance
}

export async function getLocalCache<T>({ id, getter, type, ttl = 3600 * 1000 }: CacheArgs<T>): Promise<T> {
  // 1. 全局开关
  if (!env.ENABLE_LOCAL_CACHE) {
    return await getter()
  }

  const key = `${type}-${id}`
  const adapter = await getAdapter()

  // 2. 尝试读取缓存
  try {
    const cachedData = await adapter.get<T>(key)
    if (cachedData !== null) {
      return cachedData
    }
  }
  catch (e) {
    // 吞掉读取错误，降级到获取新数据
    console.warn(`[Cache] Error reading ${key}:`, e)
  }

  // 3. 请求合并 (Request Coalescing)
  // 解决缓存击穿：如果 key 正在被获取，后续请求等待同一个 Promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>
  }

  const promise = (async () => {
    try {
      const data = await getter()

      // 异步写入，不阻塞主线程返回数据
      adapter.set(key, data, ttl).catch((e) => {
        console.error(`[Cache] Failed to set cache for ${key}`, e)
      })

      return data
    }
    finally {
      pendingRequests.delete(key)
    }
  })()

  pendingRequests.set(key, promise)
  return promise
}
