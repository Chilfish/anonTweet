import type { EnrichedTweet } from './react-tweet'
import type { TweetData } from '~/types'
import { getEnrichedTweet } from './react-tweet/api'

export async function getTweets(tweetId: string): Promise<TweetData> {
  let tweet = await getEnrichedTweet(tweetId)
  let quotedTweet: EnrichedTweet | null = null
  const mainTweet = tweet || null

  if (!tweet || !mainTweet) {
    return { tweet: null, parentTweets: [], quotedTweet: null }
  }

  const parentTweets: EnrichedTweet[] = []

  while (true) {
    if (!tweet.in_reply_to_status_id_str) {
      break
    }
    const parentTweet = await getEnrichedTweet(tweet.in_reply_to_status_id_str)
    if (!parentTweet) {
      break
    }
    parentTweets.unshift(parentTweet)
    tweet = parentTweet
  }

  if (mainTweet.quoted_tweet) {
    quotedTweet = await getEnrichedTweet(mainTweet.quoted_tweet.id_str)
  }

  return {
    tweet: mainTweet,
    parentTweets,
    quotedTweet,
  }
}
