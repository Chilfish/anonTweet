import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '~/lib/env.server'
import * as schema from './schema'

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDB | null = null

const LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  '::1',
])

function isLocalDatabaseUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname.toLowerCase())
  }
  catch {
    return false
  }
}

export function getDbClient(): DrizzleDB {
  if (_db)
    return _db

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured, but database access was attempted.')
  }

  // 本地开发：devkit 写入的 `/sql` 代理地址（workerd 无法直连 TCP）。
  // 只对本地数据库生效，避免 `.dev.vars` 里残留的端点劫持远程连接；
  // 线上不设置该变量，驱动按 Neon 连接串自行推导端点。
  if (env.NEON_HTTP_ENDPOINT && isLocalDatabaseUrl(env.DATABASE_URL))
    neonConfig.fetchEndpoint = env.NEON_HTTP_ENDPOINT

  const sql = neon(env.DATABASE_URL)
  _db = drizzle({ client: sql, schema })
  return _db
}

// 辅助函数：判断 DB 是否可用，用于业务逻辑层的 if 判断
export function isDbAvailable(): boolean {
  return !!env.DATABASE_URL && env.ENABLE_DB_CACHE
}
