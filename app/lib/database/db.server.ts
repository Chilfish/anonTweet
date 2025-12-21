import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '~/lib/env.server'
import * as schema from './schema'

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDB | null = null

export function getDbClient(): DrizzleDB {
  if (_db)
    return _db

  if (!env.DB_URL) {
    throw new Error('Database URL is not configured, but database access was attempted.')
  }

  const sql = neon(env.DB_URL)
  _db = drizzle({ client: sql, schema })
  return _db
}

// 辅助函数：判断 DB 是否可用，用于业务逻辑层的 if 判断
export function isDbAvailable(): boolean {
  return !!env.DB_URL && env.ENABLE_DB_CACHE
}

console.log('isDbAvailable', isDbAvailable())
