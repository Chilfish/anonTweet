import type { ArticleTranslation } from '~/lib/article/translate'
import type { EnrichedTweet, TranslationEntity } from '~/types'
import type { AIVisionInfo } from '~/types/vision'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { tweet, tweetArticleTranslations, tweetEntities } from '~/lib/database/schema'
import { isArticleUrl } from '~/lib/react-tweet/utils/article'
import { getEnrichedTweet, resolveSpaceById } from '~/lib/react-tweet/utils/get-tweet'
import { resolveSpaceId } from '~/lib/react-tweet/utils/space'
import { getLocalCache, setLocalCache } from '../localCache'

/**
 * 为**已缓存**的推文回填 / 升级 `space` 字段。
 *
 * 背景：`space`（及其 `availability`）是后加字段，改动前落地的缓存
 * （memory LRU / 本地文件 / DB jsonContent）没有它/是旧结构；而命中缓存时不会再走
 * `getEnrichedTweet`，于是 Space 卡片/墓碑**永远不出现**（实测：已删除的 Space 推文
 * 在缓存命中时仍然只渲染一个裸链接，`cache.get … hit:true`）。
 *
 * 缓存不保留原始 `card`，但 Space 链接始终存在于实体里，故用 `resolveSpaceId(null, entities)`
 * 即可覆盖「带卡片」与「无卡片」两种推文。回填结果 best-effort 写回两层缓存，
 * 避免每次浏览都重打上游；取数失败（如 429）保持原样返回。
 */
async function backfillSpaceDetails(tweet: EnrichedTweet): Promise<EnrichedTweet> {
  // 结构已是最新（带 availability）才视为无需处理；缺字段的旧结构顺带升级一次
  if (tweet.space?.availability)
    return tweet

  const spaceId = resolveSpaceId(null, tweet.entities)
  if (!spaceId)
    return tweet

  const space = await resolveSpaceById(spaceId, tweet.user)
  if (!space)
    return tweet

  const patched: EnrichedTweet = { ...tweet, space }

  await Promise.allSettled([
    setLocalCache({ id: tweet.id_str, type: 'tweet', value: patched }),
    insertToTweetDB([patched]),
  ])

  return patched
}

/**
 * 为**已缓存**的文章型推文回填 `article` 字段。
 *
 * `article` 是后加字段：改动前落地的缓存没有它（或只有 flat 的 `plainText`），
 * 命中缓存时不再走 `getEnrichedTweet`，于是文章只渲染正文里那条裸链接。旧缓存不保留
 * 原始 `article` 节点，但文章链接始终存在于实体里，故据此探测并重抓一次上游；
 * 结果 best-effort 写回两层缓存，取数失败（如 429）保持原样返回。
 *
 * 判别用 `format === 'rich'`（结构化）而非「有没有 article」——否则 flat 缓存会被
 * 误当成最新，DB 行将永不升级为块文档。
 */
async function backfillArticleDetails(tweet: EnrichedTweet): Promise<EnrichedTweet> {
  if (tweet.article?.format === 'rich')
    return tweet

  const hasArticleLink = tweet.entities.some(e => isArticleUrl((e as { href?: string }).href))
  if (!hasArticleLink)
    return tweet

  const fresh = await getEnrichedTweet(tweet.id_str)
  if (!fresh?.article)
    return tweet

  const patched: EnrichedTweet = { ...tweet, article: fresh.article }

  await Promise.allSettled([
    setLocalCache({ id: tweet.id_str, type: 'tweet', value: patched }),
    insertToTweetDB([patched]),
  ])

  return patched
}

/**
 * 读单条推文：localCache → DB → 上游。
 *
 * 出口依次做 Space / Article 回填（见 `backfillSpaceDetails`、`backfillArticleDetails`），
 * 使旧缓存与新抓取走同一呈现路径。
 */
export async function getLocalTweet(tweetId: string): Promise<EnrichedTweet | null> {
  const tweet = await getLocalCache({
    id: tweetId,
    type: 'tweet',
    getter: () => getDBTweet(tweetId),
  })

  if (!tweet)
    return tweet

  return backfillArticleDetails(await backfillSpaceDetails(tweet))
}

export function mergeTranslationEntities(enrichedTweet: EnrichedTweet, entities: TranslationEntity[]) {
  const baseIndexSet = new Set(enrichedTweet.entities.map(e => e.index))

  // 1. 按 index 对齐覆盖翻译
  entities.forEach((entity) => {
    if (!baseIndexSet.has(entity.index))
      return
    const idx = enrichedTweet.entities.findIndex(e => e.index === entity.index)
    if (idx > -1) {
      enrichedTweet.entities[idx]!.translation = entity.translation
    }
  })

  // 2. base 中不存在索引的额外实体（如句首补充 index: -1）：句首补充插入最前，
  //    其余（media_alt / AI 流片段等）按 index 排序追加到末尾，避免读取时丢数据
  const extras = entities
    .filter(e => !baseIndexSet.has(e.index))
    .sort((a, b) => a.index - b.index)
  const prepends = extras.filter(e => e.index < 0)
  const tails = extras.filter(e => e.index >= 0)

  enrichedTweet.entities.unshift(...prepends)
  enrichedTweet.entities.push(...tails)
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

/**
 * 读取某条文章推文的按块译文。
 *
 * 两级：localCache（`article-translation`，本地 FS/内存）→ DB（`tweet_article_translations`）。
 * 与 `tweet.jsonContent` 无关——后者会被上游结果整条 upsert 覆盖，译文放进去会丢。
 * 无 DB / 查询失败时返回 null（页面据此回退为原文，不伪造译文）。
 */
export async function getArticleTranslation(tweetId: string): Promise<ArticleTranslation | null> {
  const fromDb = async (): Promise<ArticleTranslation | null> => {
    if (!isDbAvailable())
      return null
    try {
      const row = await getDbClient().query.tweetArticleTranslations.findFirst({
        where: eq(tweetArticleTranslations.tweetId, tweetId),
      })
      return row?.translations ?? null
    }
    catch (error) {
      console.warn('[ArticleTrans] read failed:', error)
      return null
    }
  }

  // localCache 未命中时回源 DB，并顺带写回本地层，避免每次浏览都打库
  return getLocalCache<ArticleTranslation | null>({
    id: tweetId,
    type: 'article-translation',
    getter: fromDb,
  })
}

/**
 * 持久化某条文章推文的按块译文（best-effort，同时写本地缓存 + DB）。
 */
export async function updateArticleTranslation(
  tweetId: string,
  translation: ArticleTranslation,
): Promise<void> {
  await Promise.allSettled([
    setLocalCache({ id: tweetId, type: 'article-translation', value: translation }),
    (async () => {
      if (!isDbAvailable())
        return
      try {
        await getDbClient()
          .insert(tweetArticleTranslations)
          .values({ tweetId, translations: translation })
          .onConflictDoUpdate({
            target: tweetArticleTranslations.tweetId,
            set: { translations: translation, updatedAt: new Date() },
          })
      }
      catch (error) {
        console.error('[ArticleTrans] write failed:', error)
      }
    })(),
  ])
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
