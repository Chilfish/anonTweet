import type { EnrichedTweet, TweetData } from '~/types'
import { getEnrichedTweet } from '~/lib/twitter.server'

export async function getTweets(tweetId: string, tweetGetter: typeof getEnrichedTweet = getEnrichedTweet): Promise<TweetData> {
  let tweet = await tweetGetter(tweetId)
  let parentTweet: EnrichedTweet | null = null
  let quotedTweet: EnrichedTweet | null = null
  const tweets: EnrichedTweet[] = []

  if (!tweet) {
    return []
  }
  else {
    tweets.push(tweet)
  }

  while (true) {
    if (!tweet) {
      break
    }
    if (tweet.quotedTweetId) {
      quotedTweet = await tweetGetter(tweet.quotedTweetId)
      if (quotedTweet) {
        tweet.quotedTweet = quotedTweet
      }
    }
    if (tweet.in_reply_to_status_id_str) {
      parentTweet = await tweetGetter(tweet.in_reply_to_status_id_str)
      if (parentTweet) {
        tweets.unshift(parentTweet)
      }
    }

    if (!tweet.in_reply_to_status_id_str) {
      break
    }
    tweet = parentTweet
  }

  return tweets.sort((a, b) => a.id.localeCompare(b.id))
}
