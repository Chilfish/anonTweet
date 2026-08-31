import type { Route } from './+types/search'
import type { EnrichedTweet } from '~/types'
import { data } from 'react-router'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchSearchTweets } from '~/lib/react-tweet/utils/get-tweet'
import { searchTweetSchema } from '~/lib/validations/search'

export interface SearchResponse {
  tweets: EnrichedTweet[]
  nextCursor: string | null
}

function enrichResult(raw: Awaited<ReturnType<typeof fetchSearchTweets>>): SearchResponse {
  return {
    tweets: raw.tweets.map(tweet => enrichTweet(tweet)).filter(tweet => !!tweet),
    nextCursor: raw.nextCursor || null,
  }
}

/**
 * GET /api/tweet/search?q=&type=&cursor=&count= — Twitter/X 推文搜索。
 *
 * BFF 只做聚合：业务逻辑（fetchSearchTweets / parseSearchTimeline）在
 * app/lib/react-tweet/utils/get-tweet.ts；推文元素经 enrichTweet 转
 * EnrichedTweet，格式同 /api/tweet/get；分页形态同 /api/tweet/replies
 * （{ tweets, nextCursor }）。
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const parsed = searchTweetSchema.safeParse({
    q: url.searchParams.get('q') || '',
    type: url.searchParams.get('type') || 'latest',
    cursor: url.searchParams.get('cursor') || undefined,
    count: url.searchParams.get('count') || '20',
  })

  if (!parsed.success) {
    return data({ tweets: [], nextCursor: null }, { status: 400 })
  }

  try {
    const { q, type, cursor, count } = parsed.data
    const result = await fetchSearchTweets(q, { type, count, cursor })
    return enrichResult(result)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = error instanceof Error && 'status' in error
      ? Number((error as { status: unknown }).status) || 500
      : 500
    return data({
      error: 'Failed to search tweets',
      message: `搜索失败，${message}`,
    }, {
      status,
    })
  }
}
