import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import { getTweets } from '~/lib/getTweet'
import { extractTweetId } from '~/lib/utils'

export async function loader({
// export async function clientLoader({
  params,
  request,
}: Route.LoaderArgs): Promise<TweetData & {
  tweetId?: string
}> {
  const isDebug = new URLSearchParams(request.url.split('?')[1]).get('debug') === 'true'
  if (isDebug) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: params.id }
  }
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return { tweet: null, parentTweets: [], quotedTweet: null, tweetId: id }
  }
  const { tweet, parentTweets, quotedTweet } = await getTweets(tweetId)
  return { tweet, parentTweets, quotedTweet, tweetId }
}

export async function action({
  params,
  request,
}: Route.ActionArgs): Promise<Response> {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return new Response('Not Found', { status: 404 })
  }
  const data = await getTweets(tweetId)
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
