import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { getTweets } from '~/lib/service/getTweet'
import { getDBTweet } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'
import { requireAuth } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

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
