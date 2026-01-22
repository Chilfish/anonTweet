import type { Route } from './+types/replies'
import type { TweetData } from '~/types'
import { getLocalCache } from '~/lib/localCache'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchReplies } from '~/lib/react-tweet/utils/get-tweet'

function getLocalReplies(tweetId: string) {
  return getLocalCache({
    id: tweetId,
    type: 'replies',
    getter: () => fetchReplies(tweetId).then(d => d.map(t => enrichTweet(t)).filter(tweet => !!tweet)),
  })
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { id } = params
  const data = await getLocalReplies(id)
  return data.filter(tweet => tweet.id_str !== id)
}
