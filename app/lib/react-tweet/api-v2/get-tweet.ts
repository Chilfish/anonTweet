import type { EnrichedTweet, RawTweet } from './types'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { IUserTweetsResponse } from '~/lib/rettiwt-api/types/raw/user/Tweets'
// import { writeFile } from 'node:fs/promises'
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
    .request<IUserTweetsResponse>(ResourceType.USER_TIMELINE, { id: userId })
    .then(({ data }) => {
      const rawTweets = data.user.result.timeline.timeline
        .instructions
        .filter(d => d.type === 'TimelineAddEntries')
        .flatMap(d => d.entries)
        .filter(entry => [
          'tweet-',
          'profile-conversation-',
        ].some(id => entry.entryId.startsWith(id)),
        )

      const tweets1 = rawTweets
        .filter(e => e.content.itemContent?.itemType === 'TimelineTweet')
        .map(e => e.content.itemContent?.tweet_results.result as unknown as RawTweet)

      const tweets2 = rawTweets.filter(d => d.content.entryType === 'TimelineTimelineModule')
        .flatMap(d => d.content.items
          .map(({ item }) => item.itemContent.tweet_results.result as unknown as RawTweet))
        .filter(Boolean)

      return [...tweets1, ...tweets2].sort((a, b) => b.rest_id.localeCompare(a.rest_id))
    },
    )
}

export async function getEnrichedUserTweet(userId: string): Promise<EnrichedTweet[]> {
  const tweets = await fetchUserTweet(userId)
  // await writeFile('data/user-timeline-tweets.json', JSON.stringify(tweets, null, 2), 'utf8')
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
