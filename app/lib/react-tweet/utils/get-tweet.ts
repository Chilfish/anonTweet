import type { IListTweetsResponse } from '~/lib/rettiwt-api/types/raw/list/Tweets'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { ITweetRepliesResponse } from '~/lib/rettiwt-api/types/raw/tweet/Replies'
import type { ITweetSearchResponse } from '~/lib/rettiwt-api/types/raw/tweet/Search'
import type { IUserDetailsResponse } from '~/lib/rettiwt-api/types/raw/user/Details'
import type { IUserTweetsResponse } from '~/lib/rettiwt-api/types/raw/user/Tweets'
import type { EnrichedTweet, RawTweet, RawUser } from '~/types'
import { ResourceType, TweetRepliesSortType } from '~/lib/rettiwt-api'
import { Extractors } from '~/lib/rettiwt-api/collections/Extractors'
import { findByFilter } from '~/lib/rettiwt-api/helper/JsonUtils'
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

export interface FetchRepliesResult {
  tweets: RawTweet[]
  nextCursor: string | null
}

function getBottomCursor(data: NonNullable<unknown>): string | null {
  const cursors = findByFilter<{ value?: string }>(data, 'cursorType', 'Bottom')
  const value = cursors.at(-1)?.value
  return value ? String(value) : null
}

export async function fetchReplies(tweetId: string, cursor?: string): Promise<FetchRepliesResult> {
  return twitterPool.run(async (fetcher) => {
    const response = await fetcher.request<ITweetRepliesResponse>(
      ResourceType.TWEET_REPLIES,
      {
        id: tweetId,
        sortBy: TweetRepliesSortType.LIKES,
        cursor,
      },
    )

    const instructions = response.data
      .threaded_conversation_with_injections_v2
      .instructions
      .filter(t => t.type === 'TimelineAddEntries')

    const mainTweet = instructions.flatMap(d => d.entries?.filter(e => e.content.entryType === 'TimelineTimelineItem') || [])
      .flatMap(entry => (entry.content.itemContent?.tweet_results.result))
      .filter(result => !!result)
      .at(0) as RawTweet | undefined

    const comments = instructions
      .flatMap(t => t.entries?.filter(d => d.content.entryType === 'TimelineTimelineModule') || [])
      .flatMap(entry => (entry.content.items || []).map(d => d.item.itemContent.tweet_results.result))
      .filter(result => !!result)

    return {
      // 部分分页批次不一定包含 mainTweet，避免返回空对象导致 enrich 过程崩溃
      tweets: [
        ...comments as unknown as RawTweet[],
        ...(mainTweet ? [mainTweet] : []),
      ],
      nextCursor: getBottomCursor(response.data),
    }
  })
}

export interface FetchSearchResult {
  tweets: RawTweet[]
  nextCursor: string | null
}

export interface SearchTweetOptions {
  /** 搜索结果类型：`top` 热门（默认 X 页面 Mod）| `latest` 最新。缺省走 latest。 */
  type?: 'top' | 'latest'
  /** 每页数量（SearchTimeline 上限约 20）。 */
  count?: number
  /** 上一页返回的 bottom cursor，用于翻页。 */
  cursor?: string
}

/**
 * 搜索结果中的单个 tweet result 可能是 `TweetWithVisibilityResults` 包装
 * （真实推文在 `.tweet` 下），统一解包为 RawTweet 再交给 enrich。
 */
function unwrapSearchTweetResult(result: unknown): RawTweet {
  if (!result || typeof result !== 'object')
    return result as RawTweet

  const wrapped = result as { __typename?: string, tweet?: RawTweet }
  return wrapped.__typename === 'TweetWithVisibilityResults' && wrapped.tweet
    ? wrapped.tweet
    : result as RawTweet
}

/**
 * 解析 SearchTimeline 原始响应 → 推文列表 + 下一页光标。
 *
 * 纯函数（可直接单测，规避 postmortem #001 解析器零测试）：遍历
 * `search_by_raw_query.search_timeline.timeline.instructions`，只取 entryId
 * 前缀 `tweet-` 且非 TimelineTimelineCursor 的 entry，提取
 * `itemContent.tweet_results.result`（自动解包 TweetWithVisibilityResults）；
 * 光标复用 `getBottomCursor`。解析范式对齐 `fetchListTweets`（同款 timeline 结构）。
 *
 * 关键词（query）以原样透传为 rawQuery —— X 高级搜索语法（`from:` / `to:` /
 * `min_faves:` / `since:` / `until:` / `lang:` / `#话题` / `-排除` / `"精确短语"`
 * 等）随 `TweetFilter.includeWords.join(' ')` 原样进入请求，不做改写。
 */
export function parseSearchTimeline(response: ITweetSearchResponse): FetchSearchResult {
  const instructions
    = response.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || []

  const tweets = instructions
    .flatMap(instruction => instruction.entries || [])
    .filter(entry => entry.entryId?.startsWith('tweet-'))
    .filter(entry => entry.content?.entryType !== 'TimelineTimelineCursor')
    .map(entry => unwrapSearchTweetResult(entry.content.itemContent?.tweet_results?.result))
    .filter(tweet => !!tweet)

  return {
    tweets,
    nextCursor: getBottomCursor(response.data),
  }
}

export async function fetchSearchTweets(
  query: string,
  options: SearchTweetOptions = {},
): Promise<FetchSearchResult> {
  return twitterPool.run(async (fetcher) => {
    const response = await fetcher.request<ITweetSearchResponse>(
      ResourceType.TWEET_SEARCH,
      {
        filter: {
          includeWords: [query],
          top: options.type === 'top',
        },
        count: options.count,
        cursor: options.cursor,
      },
    )

    return parseSearchTimeline(response)
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
