import type { IGPost } from '~/types'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { igPost } from '~/lib/database/schema'
import { getLocalCache } from '~/lib/localCache'

/**
 * 从 DB 缓存读取 IG 帖子。
 *
 * 与 getDBTweet 模式一致：DB 可用时优先查 DB，未命中则返回 null 由调用方走 SDK。
 */
export async function getDBIGPost(shortcode: string): Promise<IGPost | null> {
  if (!isDbAvailable()) {
    return null
  }

  const db = getDbClient()

  try {
    const cached = await db.query.igPost.findFirst({
      where: eq(igPost.postShortcode, shortcode),
    })

    return cached?.jsonContent ?? null
  }
  catch (error) {
    console.warn('[IG] DB access failed, falling back to SDK:', error)
    return null
  }
}

/**
 * 将 IG 帖子写入 DB 缓存（upsert）。
 */
export async function insertToIGPostDB(post: IGPost): Promise<void> {
  if (!isDbAvailable()) {
    return
  }

  const db = getDbClient()

  try {
    await db.insert(igPost)
      .values({
        postShortcode: post.id,
        username: post.username,
        jsonContent: post,
      })
      .onConflictDoUpdate({
        target: igPost.postShortcode,
        set: {
          jsonContent: post,
          username: post.username,
        },
      })
  }
  catch (error) {
    console.error('[IG] Failed to insert post to DB:', error)
  }
}

/**
 * 双层缓存获取 IG 帖子：
 * 1. 本地缓存（内存 / FS）
 * 2. DB 缓存（PostgreSQL / Neon）
 * 3. 由 getter（SDK fetch）提供数据
 */
export async function getCachedIGPost(
  shortcode: string,
  getter: () => Promise<IGPost | null>,
): Promise<IGPost | null> {
  return getLocalCache({
    id: shortcode,
    type: 'ig-post',
    getter: async () => {
      // 先查 DB
      const dbHit = await getDBIGPost(shortcode)
      if (dbHit) {
        return dbHit
      }

      // DB 未命中 → SDK 获取
      const post = await getter()
      if (!post) {
        return null
      }

      // 异步写回 DB（不阻塞）
      insertToIGPostDB(post).catch((e) => {
        console.error('[IG] Background DB insert failed:', e)
      })

      return post
    },
  })
}
