import type { EnrichedTweet } from './react-tweet'
import type { TweetData } from '~/types'
import { getEnrichedTweet } from './react-tweet/api-v2'
// import { writeFile } from 'node:fs/promises'

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
    if (tweet.quoted_tweet_id) {
      quotedTweet = await tweetGetter(tweet.quoted_tweet_id)
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

  // await writeFile('tmp/tweets.json', JSON.stringify(tweets, null, 2), 'utf8')

  return tweets.sort((a, b) => a.id_str.localeCompare(b.id_str))
}
