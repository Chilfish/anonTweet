import type { EnrichedTweet } from './react-tweet'
import type { TweetData } from '~/types'
import { getEnrichedTweet } from './react-tweet/api-v2'

export async function getTweets(tweetId: string): Promise<TweetData> {
  let tweet = await getEnrichedTweet(tweetId)
  let parentTweet: EnrichedTweet | null = null
  const tweets: EnrichedTweet[] = []

  if (!tweet) {
    return []
  }

  while (true) {
    if (!tweet) {
      break
    }
    if (tweet.quoted_tweet_id) {
      const quotedTweet = await getEnrichedTweet(tweet.quoted_tweet_id)
      if (quotedTweet) {
        tweets.unshift(quotedTweet)
      }
    }
    if (tweet.in_reply_to_status_id_str) {
      parentTweet = await getEnrichedTweet(tweet.in_reply_to_status_id_str)
      if (parentTweet) {
        tweets.unshift(parentTweet)
      }
    }

    tweet = parentTweet
  }

  return tweets
}
