import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { extractTweetId } from '~/lib/utils'

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

  return []
  // const tweets = await getTweets(tweetId, getUserTweet)
  // return tweets
}
