import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import { getTweets } from '~/lib/getTweet'
import { extractTweetId } from '~/lib/utils'

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<TweetData & {
  tweetId?: string
}> {
  const isDebug = new URLSearchParams(request.url.split('?')[1]).get('debug') === 'true'
  if (isDebug) {
    return []
  }
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }
  const tweets = await getTweets(tweetId)
  return tweets
}

export async function action({
  params,
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
