import type { EnrichedTweet } from '~/lib/react-tweet'

export interface TweetData {
  tweet: EnrichedTweet | null
  quotedTweet: EnrichedTweet | null
  parentTweets: EnrichedTweet[]
//   replyTweets: EnrichedTweet[]
}
