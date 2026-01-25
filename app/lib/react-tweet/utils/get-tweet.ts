import type { IListTweetsResponse } from '~/lib/rettiwt-api/types/raw/list/Tweets'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { ITweetRepliesResponse } from '~/lib/rettiwt-api/types/raw/tweet/Replies'
import type { IUserDetailsResponse } from '~/lib/rettiwt-api/types/raw/user/Details'
import type { IUserTweetsResponse } from '~/lib/rettiwt-api/types/raw/user/Tweets'
import type { EnrichedTweet, RawTweet, RawUser } from '~/types'
import { ResourceType, TweetRepliesSortType } from '~/lib/rettiwt-api'
import { Extractors } from '~/lib/rettiwt-api/collections/Extractors'
import { RettiwtPool } from '~/lib/SmartPool'
import { enrichTweet } from './parseTweet'
// import { writeFile } from 'node:fs/promises'

// config.ts
const KEYS = (typeof process === 'undefined' ? '' : process.env.TWEET_KEYS || '').split(',').filter(Boolean)

// 初始化单例池
export const twitterPool = new RettiwtPool(KEYS)

export async function fetchTweet(id: string): Promise<RawTweet> {
  return twitterPool.run(async (fetcher) => {
    const response = await fetcher.request<ITweetDetailsResponse>(
      ResourceType.TWEET_DETAILS,
      { id },
    )

    return response.data.tweetResult.result
  })
}

export async function fetchListTweets(id: string): Promise<RawTweet[]> {
  return twitterPool.run(async fetcher => fetcher
    .request<IListTweetsResponse>(ResourceType.LIST_TWEETS, { id })
    .then(({ data }) => (data.list?.tweets_timeline?.timeline?.instructions || [])
      .flatMap(instruction => instruction.entries.map(entry => entry.content.itemContent?.tweet_results?.result as unknown as RawTweet))
      .filter(tweet => !!tweet),
    ),
  )
}

export async function fetchUserDetails(id: string): Promise<RawUser | null> {
  return twitterPool.run(async (fetcher) => {
    let resource: ResourceType
    if (id && Number.isNaN(Number(id))) {
      resource = ResourceType.USER_DETAILS_BY_USERNAME
    }
    else {
      resource = ResourceType.USER_DETAILS_BY_ID
    }
    if (!id) {
      return null
    }
    const response = await fetcher.request<IUserDetailsResponse>(resource, { id })
    const data = Extractors[resource](response)
    return data || null
  })
}

export async function fetchUserTweet(userId: string): Promise<RawTweet[]> {
  return twitterPool.run(async fetcher => fetcher
    .request<IUserTweetsResponse>(ResourceType.USER_TIMELINE_AND_REPLIES, { id: userId })
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
    ),
  )
}

export async function fetchReplies(tweetId: string): Promise<RawTweet[]> {
  return await twitterPool.run(async (fetcher) => {
    const response = await fetcher.request<ITweetRepliesResponse>(
      ResourceType.TWEET_REPLIES,
      {
        id: tweetId,
        sortBy: TweetRepliesSortType.LIKES,
      },
    )
    const data = response.data
      .threaded_conversation_with_injections_v2
      .instructions
      .filter(t => t.type === 'TimelineAddEntries')

    const mainTweet = (data.flatMap(d => d.entries?.filter(e => e.content.entryType === 'TimelineTimelineItem') || [])
      .flatMap(entry => (entry.content.itemContent?.tweet_results.result))
      .filter(result => !!result)
      .at(0) || {}) as RawTweet

    const comments = data.flatMap(t => t.entries?.filter(d => d.content.entryType === 'TimelineTimelineModule') || [])
      .flatMap(entry => (entry.content.items || []).map(d => d.item.itemContent.tweet_results.result))
      .filter(result => !!result)

    return [...comments as unknown as RawTweet[], mainTweet]
  })
}

export async function getEnrichedUserTweet(userId: string): Promise<EnrichedTweet[]> {
  const tweets = await fetchUserTweet(userId)
  // await writeFile('data/user-timeline-tweets.json', JSON.stringify(tweets, null, 2), 'utf8')
  return tweets
    .map((tweet) => {
      const enrichedTweet = enrichTweet(tweet)
      if (tweet.quoted_status_result?.result && enrichedTweet) {
        const quotedTweet = enrichTweet(tweet.quoted_status_result.result)
        if (quotedTweet)
          enrichedTweet.quotedTweet = quotedTweet
      }
      return enrichedTweet
    })
    .filter(tweet => !!tweet)
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
  // await writeFile('build/tweet.json', JSON.stringify(tweet, null, 2), 'utf8')
  try {
    const richTweet = enrichTweet(tweet)
    return richTweet
  }
  catch (error) {
    console.error('Error fetching tweet:', error)
    return null
  }
}
