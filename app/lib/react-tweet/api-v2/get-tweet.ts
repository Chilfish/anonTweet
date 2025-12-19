import type { EnrichedTweet, RawTweet } from './types'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { IUserTweetsAndRepliesResponse } from '~/lib/rettiwt-api/types/raw/user/TweetsAndReplies'
import { FetcherService, ResourceType, Rettiwt } from '~/lib/rettiwt-api'
import { RettiwtConfig } from '~/lib/rettiwt-api/models/RettiwtConfig'
import { enrichTweet } from './parseTweet'

const TWEET_KEY = typeof process !== 'undefined' ? process.env.TWEET_KEY || '' : ''

// console.log('Using TWEET_KEY:', TWEET_KEY ? 'Yes' : 'No')

const configs = new RettiwtConfig({ apiKey: TWEET_KEY })
const fetcher = new FetcherService(configs)
const rettiwt = new Rettiwt(configs)

export async function fetchTweet(id: string): Promise<RawTweet> {
  return await fetcher
    .request<ITweetDetailsResponse>(ResourceType.TWEET_DETAILS, { id })
    .then(({ data }) => data.tweetResult.result)
}

export async function fetchUserDetails(username: string) {
  return rettiwt.user.details(username)
}

export async function fetchUserTweet(userId: string): Promise<RawTweet[]> {
  return await fetcher
    .request<IUserTweetsAndRepliesResponse>(ResourceType.USER_TIMELINE_AND_REPLIES, { id: userId })
    .then(({ data }) => data.user.result.timeline.timeline
      .instructions
      .filter(d => d.type === 'TimelineAddEntries')
      .flatMap(d => d.entries.map(e => e.content.itemContent?.tweet_results.result as unknown as RawTweet))
      .filter(Boolean),
    )
}

export async function getEnrichedUserTweet(userId: string): Promise<EnrichedTweet[]> {
  const tweets = await fetchUserTweet(userId)
  return tweets
    .map((tweet) => {
      const enrichedTweet = enrichTweet(tweet)
      if (tweet.quoted_status_result?.result) {
        const quotedTweet = enrichTweet(tweet.quoted_status_result.result)
        enrichedTweet.quotedTweet = quotedTweet
      }
      return enrichedTweet
    })
    .filter((tweet) => {
      const isAd = tweet.user.id_str !== userId && !tweet.retweetedOrignalId

      return !isAd
    })
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
    return richTweet
  }
  catch (error) {
    console.error('Error fetching tweet:', error)
    return null
  }
}
