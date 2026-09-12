import type { IGPost } from '~/types'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { igPost } from '~/lib/database/schema'
import { getLocalCache, setLocalCache } from '~/lib/localCache'

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
 *
 * `shortcode` 必须是**读取侧使用的缓存键**（即请求标识），默认回退到 `post.id`。
 * story/highlight 的请求键为 `username/story_id`，与 SDK `post.id` 不同；若此处写
 * `post.id`，读取侧将永远查不到（AC-IG-STORY-003）。
 */
export async function insertToIGPostDB(post: IGPost, shortcode = post.id): Promise<void> {
  if (!isDbAvailable()) {
    return
  }

  const db = getDbClient()

  try {
    await db.insert(igPost)
      .values({
        postShortcode: shortcode,
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

      // 异步写回 DB（不阻塞）；写入键必须与读取键一致
      insertToIGPostDB(post, shortcode).catch((e) => {
        console.error('[IG] Background DB insert failed:', e)
      })

      return post
    },
  })
}

/**
 * 列表型请求（用户快拍 tray / 精选集）：新鲜拉取，并逐个 item 落缓存。
 *
 * 列表本身不缓存（故事 24h 变化；也避免翻译后列表陈旧），代价为每次访问打一次
 * SDK `reels_media`。每个 item 以**自身 canonical id**（`story~…` / `highlight~…`）
 * 写入 localCache + DB，使 per-card 翻译端点（`/api/ig/translate/{post.id}`）能解析到
 * 该条目，并合并已有 `captionTranslation` 以免重复翻译。
 */
export async function getIGPostList(getter: () => Promise<IGPost[]>): Promise<IGPost[]> {
  const posts = await getter()
  if (!posts.length) {
    return []
  }

  return Promise.all(posts.map(async (post) => {
    const cached = await getLocalCache<IGPost | null>({
      id: post.id,
      type: 'ig-post',
      getter: async () => null,
    }).catch(() => null)

    const merged = cached?.captionTranslation
      ? { ...post, captionTranslation: cached.captionTranslation }
      : post

    setLocalCache({ id: merged.id, type: 'ig-post', value: merged }).catch(() => {})
    insertToIGPostDB(merged).catch((e) => {
      console.error('[IG] Failed to cache list item:', e)
    })

    return merged
  }))
}

/**
 * 更新 IG 帖子的翻译结果到 DB + localCache。
 *
 * 用于翻译按钮触发后持久化 captionTranslation。
 */
export async function updateIGPostTranslation(
  shortcode: string,
  captionTranslation: string,
): Promise<void> {
  // 1. 更新 DB
  if (isDbAvailable()) {
    const db = getDbClient()
    try {
      const cached = await db.query.igPost.findFirst({
        where: eq(igPost.postShortcode, shortcode),
      })
      if (cached) {
        const updated = { ...cached.jsonContent, captionTranslation }
        await db.update(igPost)
          .set({ jsonContent: updated })
          .where(eq(igPost.postShortcode, shortcode))
      }
    }
    catch (error) {
      console.error('[IG] Failed to update translation in DB:', error)
    }
  }

  // 2. 更新 localCache
  try {
    const cached = await getLocalCache<IGPost | null>({
      id: shortcode,
      type: 'ig-post',
      getter: async () => null,
    })
    if (cached) {
      await setLocalCache({
        id: shortcode,
        type: 'ig-post',
        value: { ...cached, captionTranslation },
      })
    }
  }
  catch {
    // localCache update is best-effort
  }
}
