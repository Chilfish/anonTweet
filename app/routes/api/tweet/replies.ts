import type { Route } from './+types/replies'
import type { TweetData } from '~/types'
import { getLocalCache } from '~/lib/localCache'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchReplies } from '~/lib/react-tweet/utils/get-tweet'

export interface RepliesResponse {
  tweets: TweetData
  nextCursor: string | null
}

function getLocalReplies(tweetId: string, cursor?: string) {
  return getLocalCache({
    // cursor 为 base62 字符串，直接作为 key 使用即可
    // Windows 文件名不允许 ':'，使用 '_' 分隔即可
    id: cursor ? `${tweetId}_${cursor}` : tweetId,
    type: 'replies',
    getter: () => fetchReplies(tweetId, cursor).then(({ tweets, nextCursor }) => ({
      tweets: tweets.map(t => enrichTweet(t)).filter(tweet => !!tweet),
      nextCursor,
    })),
  })
}

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<RepliesResponse> {
  const { id } = params
  const cursor = new URL(request.url).searchParams.get('cursor') || undefined
  const { tweets, nextCursor } = await getLocalReplies(id, cursor)

  return {
    tweets: tweets.filter(tweet => tweet.id_str !== id),
    nextCursor: nextCursor || null,
  }
}
