import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchListTweets } from '~/lib/react-tweet/utils/get-tweet'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { id } = params
  const tweets = await fetchListTweets(id)
  return tweets.map(tweet => enrichTweet(tweet))
}
