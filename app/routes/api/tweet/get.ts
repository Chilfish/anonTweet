import type { Route } from './+types/get'
import type { EnrichedTweet } from '~/lib/react-tweet'
import type { TweetData } from '~/types'
import { eq } from 'drizzle-orm'
import { db } from '~/lib/database/db.server'
import { tweet, tweetEntities } from '~/lib/database/schema'
import { getTweets } from '~/lib/getTweet'
import { getEnrichedTweet } from '~/lib/react-tweet/api-v2'
import { extractTweetId } from '~/lib/utils'
import { requireAuth, requireUser } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

async function getDBTweet(tweetId: string): Promise<EnrichedTweet | null> {
  const cachedTweet = await db.query.tweet.findFirst({
    where: eq(tweet.tweetId, tweetId),
  })
  const enrichedTweet = cachedTweet?.jsonContent || await getEnrichedTweet(tweetId)

  if (!enrichedTweet) {
    return null
  }

  if (!cachedTweet?.id) {
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

  const { user } = requireUser()
  const translationEntities = await db.query.tweetEntities.findMany({
    where: eq(tweetEntities.tweetUserId, `${tweetId}-${user.id}`),
  }).then(r => r[0])

  if (translationEntities) {
    translationEntities.entities.forEach((entity) => {
      const idx = enrichedTweet.entities.findIndex(e => e.index === entity.index)
      if (idx > -1) {
        enrichedTweet.entities[idx]!.translation = entity.translation
      }
    })
  }

  return enrichedTweet
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData & {
  tweetId?: string
}> {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }
  const tweets = await getTweets(tweetId, getDBTweet)
  return tweets
}
