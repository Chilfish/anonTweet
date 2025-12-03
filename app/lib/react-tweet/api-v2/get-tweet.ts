import type { EnrichedTweet, RawTweet } from './types'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import { FetcherService, ResourceType } from '~/lib/rettiwt-api'
import { enrichTweet } from './parseTweet'

const TWEET_KEY = typeof process !== 'undefined' ? process.env.TWEET_KEY || '' : ''

// console.log('Using TWEET_KEY:', TWEET_KEY ? 'Yes' : 'No')

// @ts-expect-error: The FetcherService constructor does not must require an API key
const fetcher = new FetcherService({ apiKey: TWEET_KEY })

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
  try {
    const richTweet = enrichTweet(tweet)
    // if (richTweet.quoted_tweet) {
    //   const quotedTweet = await fetchTweet(richTweet.quoted_tweet.id_str)
    //   if (quotedTweet) {
    //     richTweet.quoted_tweet = enrichTweet(quotedTweet)
    //   }
    // }

    return richTweet
  }
  catch (error) {
    console.error('Error fetching tweet:', error)
    return null
  }
}
