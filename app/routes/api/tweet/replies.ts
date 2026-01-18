import type { Route } from './+types/replies'
import type { TweetData } from '~/types'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchReplies } from '~/lib/react-tweet/utils/get-tweet'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { id } = params
  const tweets = await fetchReplies(id)
  return tweets.map(tweet => enrichTweet(tweet))
}
