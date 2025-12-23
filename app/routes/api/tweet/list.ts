import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { enrichTweet, fetchListTweets } from '~/lib/react-tweet'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { id } = params
  const tweets = await fetchListTweets(id)
  return tweets.map(tweet => enrichTweet(tweet))
}
