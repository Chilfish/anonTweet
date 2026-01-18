import type { EnrichedTweet } from '~/types'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { tweet, tweetEntities } from '~/lib/database/schema'
import { getEnrichedTweet } from '~/lib/react-tweet/utils/get-tweet'

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
      translationEntities.entities.forEach((entity) => {
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

    return enrichedTweet
  }
  catch (error) {
    console.warn('DB access failed, using direct API:', error)
    return await getEnrichedTweet(tweetId)
  }
}

/**
 * 从本地json缓存文件获取tweet
 */
export async function getLocalTweet(tweetId: string): Promise<EnrichedTweet | null> {
  const { access, readFile, writeFile } = await import('node:fs/promises')
  const path = await import('node:path')

  const dir = 'cache'
  const filePath = path.join(dir, `${tweetId}.json`)

  const isFileExists = await access(filePath).then(() => true).catch(() => false)

  if (!isFileExists) {
    const tweet = await getEnrichedTweet(tweetId)
    await writeFile(filePath, JSON.stringify(tweet))
    return tweet
  }

  const fileContent = await readFile(filePath, 'utf8')
  const tweet = JSON.parse(fileContent)

  return tweet
}
