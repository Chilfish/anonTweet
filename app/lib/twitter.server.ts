import type {
  IAudioSpace,
  RawTweet,
  EnrichedTweet as SdkEnrichedTweet,
  SpaceDetails,
} from '@chilfish/tweet'
import type { ObsEvent, ObsFields } from '~/lib/obs-log'
import type { EnrichedTweet, RawUser } from '~/types'
import {
  attachSpaceDetails as attachSdkSpaceDetails,
  createClient,
  enrichTweet,
  mapSpaceDetails,
} from '@chilfish/tweet'
import { env } from '~/lib/env.server'
import { obsLog } from '~/lib/obs-log'
import '~/lib/tweet-request-patch'

const logger = {
  warn: (event: string, fields?: Record<string, unknown>) =>
    obsLog(event as ObsEvent, (fields ?? {}) as ObsFields),
}

export const twitter = createClient({
  keys: env.TWEET_KEYS,
  logger,
})

export function fetchTweet(id: string): Promise<RawTweet> {
  return twitter.getTweet(id)
}

export function fetchSpaceDetails(spaceId: string): Promise<IAudioSpace | null> {
  return twitter.getSpace(spaceId)
}

export function fetchListTweets(id: string): Promise<RawTweet[]> {
  return twitter.getListTweets(id)
}

export function fetchUserDetails(idOrUsername: string): Promise<RawUser | null> {
  return twitter.getUser(idOrUsername)
}

export interface FetchUserTimelineResult {
  tweets: RawTweet[]
  nextCursor: string | null
}

export function fetchUserTimeline(userId: string, cursor?: string): Promise<FetchUserTimelineResult> {
  return twitter.getUserTimeline(userId, cursor)
}

export interface FetchRepliesResult {
  tweets: RawTweet[]
  nextCursor: string | null
}

export function fetchReplies(tweetId: string, cursor?: string): Promise<FetchRepliesResult> {
  return twitter.getReplies(tweetId, { cursor })
}

export interface FetchSearchResult {
  tweets: RawTweet[]
  nextCursor: string | null
}

export interface SearchTweetOptions {
  /** 搜索结果类型：`top` 热门 | `latest` 最新。缺省走 latest。 */
  type?: 'top' | 'latest'
  /** 每页数量（SearchTimeline 上限约 20）。 */
  count?: number
  /** 上一页返回的 bottom cursor，用于翻页。 */
  cursor?: string
}

export function fetchSearchTweets(query: string, options: SearchTweetOptions = {}): Promise<FetchSearchResult> {
  return twitter.searchTweets(query, options)
}

export async function getEnrichedUserTimeline(
  userId: string,
  cursor?: string,
): Promise<{ tweets: EnrichedTweet[], nextCursor: string | null }> {
  const { tweets, nextCursor } = await fetchUserTimeline(userId, cursor)

  return {
    nextCursor,
    tweets: tweets
      .map((tweet) => {
        const enrichedTweet = enrichTweet(tweet)
        if (tweet.quoted_status_result?.result && enrichedTweet) {
          const quotedTweet = enrichTweet(tweet.quoted_status_result.result)
          if (quotedTweet)
            enrichedTweet.quotedTweet = quotedTweet
        }
        return enrichedTweet
      })
      .filter((tweet): tweet is SdkEnrichedTweet => !!tweet)
      .filter((tweet) => {
        const isAd = tweet.user.id !== userId && !tweet.retweetedOriginalId
        return !isAd
      }),
  }
}

/**
 * 按 Space id 取详情并映射为卡片数据（供 `attachSpaceDetails` 与「旧缓存回填」复用）。
 *
 * 请求失败（429 / 网络）返回 null：调用方据此降级，**不得**误判成「Space 已删除」。
 */
export async function resolveSpaceById(
  spaceId: string,
  tweetAuthor?: EnrichedTweet['user'] | null,
): Promise<SpaceDetails | null> {
  try {
    const audioSpace = await fetchSpaceDetails(spaceId)
    return mapSpaceDetails(spaceId, audioSpace, tweetAuthor)
  }
  catch (error) {
    logger.warn('space.fetch.failed', {
      spaceId,
      reason: error instanceof Error
        ? error.message
        : String(error),
    })
    return null
  }
}

export async function getEnrichedTweet(id: string): Promise<EnrichedTweet | null> {
  const tweet = await fetchTweet(id)
  if (!tweet)
    return null

  const enriched = enrichTweet(tweet)
  if (!enriched)
    return null

  await attachSdkSpaceDetails([enriched], [tweet], fetchSpaceDetails, logger)
  return enriched
}
