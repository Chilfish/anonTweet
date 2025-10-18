import type { EnrichedTweet, RawTweet } from './types'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import { FetcherService, ResourceType } from '~/lib/rettiwt-api'
import { enrichTweet } from './parseTweet'

// @ts-expect-error: The FetcherService constructor does not must require an API key
const fetcher = new FetcherService({})

export async function fetchTweet(id: string): Promise<RawTweet> {
  return await fetcher
    .request<ITweetDetailsResponse>(ResourceType.TWEET_DETAILS, { id })
    .then(({ data }) => data.tweetResult.result)
}

export async function getEnrichedTweet(
  id: string,
): Promise<EnrichedTweet | null> {
  const tweet = await fetchTweet(id)
  if (!tweet) {
    return null
  }
  const richTweet = enrichTweet(tweet)
  if (richTweet.quoted_tweet) {
    const quotedTweet = await fetchTweet(richTweet.quoted_tweet.id_str)
    if (quotedTweet) {
      richTweet.quoted_tweet = enrichTweet(quotedTweet)
    }
  }

  return richTweet
}
