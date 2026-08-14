import type { EnrichedTweet, TranslationEntity } from '~/types'
import type { AIVisionInfo } from '~/types/vision'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { tweet, tweetEntities } from '~/lib/database/schema'
import { getEnrichedTweet } from '~/lib/react-tweet/utils/get-tweet'
import { getLocalCache, setLocalCache } from '../localCache'

export const getLocalTweet = (tweetId: string) => getLocalCache({ id: tweetId, type: 'tweet', getter: () => getDBTweet(tweetId) })

export function mergeTranslationEntities(enrichedTweet: EnrichedTweet, entities: TranslationEntity[]) {
  entities.forEach((entity) => {
    const idx = enrichedTweet.entities.findIndex(e => e.index === entity.index)
    if (idx > -1) {
      enrichedTweet.entities[idx]!.translation = entity.translation
    }

    const isAlts = entity.type === 'media_alt'
    if (isAlts) {
      enrichedTweet.entities.push(entity)
    }
  })
}

export async function insertToTweetDB(tweets: EnrichedTweet[]) {
  if (!isDbAvailable()) {
    return
  }

  const db = getDbClient()

  try {
    for (const enrichedTweet of tweets) {
      await db.insert(tweet)
        .values({
          tweetId: enrichedTweet.id_str,
          tweetOwnerId: enrichedTweet.user.screen_name,
          jsonContent: {
            ...enrichedTweet,
            retweetedOrignalId: undefined,
          },
        })
        .onConflictDoUpdate({
          target: tweet.tweetId,
          set: {
            jsonContent: {
              ...enrichedTweet,
              retweetedOrignalId: undefined,
            },
          },
        })
    }
  }
  catch (error) {
    console.error('Failed to insert tweets to DB:', error)
  }
}

/**
 * 更新推文的 visionInfo 到 DB + localCache（Vision save / generate 持久化）。
 *
 * 采用「字段级合并」而非整体覆盖：仅把 visionInfo 合并进 DB jsonContent / localCache，
 * 避免用客户端快照把 DB 里可能更新的其他字段（entities 等）整体盖掉
 * （对齐 updateIGPostTranslation 更新 captionTranslation 的模式）。
 * 无现有行时（DB 尚未缓存该推文），用 baseTweet 兜底整行插入。
 * 两层均为 best-effort：失败只告警，不阻断保存流程。
 */
export async function updateTweetVisionInfo(
  tweetId: string,
  visionInfo: AIVisionInfo[],
  baseTweet?: EnrichedTweet,
): Promise<void> {
  // 1. DB
  if (isDbAvailable()) {
    const db = getDbClient()
    try {
      const cached = await db.query.tweet.findFirst({
        where: eq(tweet.tweetId, tweetId),
      })
      if (cached) {
        await db.update(tweet)
          .set({ jsonContent: { ...cached.jsonContent, visionInfo } })
          .where(eq(tweet.tweetId, tweetId))
      }
      else if (baseTweet?.user?.screen_name) {
        // 兜底整行插入：仅当 baseTweet 是完整推文（含 user）时才插入，避免残缺快照污染 DB
        await insertToTweetDB([{ ...baseTweet, visionInfo }])
      }
    }
    catch (error) {
      console.error('[Vision] Failed to update visionInfo in DB:', error)
    }
  }

  // 2. localCache
  try {
    const cached = await getLocalCache<EnrichedTweet | null>({
      id: tweetId,
      type: 'tweet',
      getter: async () => null,
    })
    if (cached) {
      await setLocalCache({ id: tweetId, type: 'tweet', value: { ...cached, visionInfo } })
    }
    else if (baseTweet) {
      await setLocalCache({ id: tweetId, type: 'tweet', value: { ...baseTweet, visionInfo } })
    }
  }
  catch {
    // localCache 更新 best-effort
  }
}

export async function getDBTweet(tweetId: string): Promise<EnrichedTweet | null> {
  // 1. 无 DB 环境：直接短路返回
  if (!isDbAvailable()) {
    return await getEnrichedTweet(tweetId)
  }
  // 2. 有 DB 环境：获取实例
  const db = getDbClient()

  try {
    const cachedTweet = await db.query.tweet.findFirst({
      where: eq(tweet.tweetId, tweetId),
    })

    const enrichedTweet = cachedTweet?.jsonContent || await getEnrichedTweet(tweetId)

    if (!enrichedTweet) {
      return null
    }

    if (!cachedTweet?.id) {
      await insertToTweetDB([enrichedTweet])
    }

    const translationEntities = await db.query.tweetEntities.findMany({
      where: eq(tweetEntities.tweetId, tweetId),
    }).then(r => r[0])

    if (translationEntities) {
      mergeTranslationEntities(enrichedTweet, translationEntities.entities)
    }

    return enrichedTweet
  }
  catch (error) {
    console.warn('DB access failed, using direct API:', error)
    return await getEnrichedTweet(tweetId)
  }
}
