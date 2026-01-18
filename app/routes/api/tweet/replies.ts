import type { Route } from './+types/replies'
import type { EnrichedTweet, TweetData } from '~/types'
import { getLocalCache } from '~/lib/localCache'
import { enrichTweet } from '~/lib/react-tweet'
import { fetchReplies } from '~/lib/react-tweet/utils/get-tweet'

function getLocalReplies(tweetId: string) {
  return getLocalCache<EnrichedTweet[]>({
    id: tweetId,
    type: 'replies',
    getter: () => fetchReplies(tweetId)
      .then(async (d) => {
        const enrichedTweets = d.map(t => enrichTweet(t))
        return enrichedTweets
      }),
  })
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { id } = params
  // const data = await getLocalReplies(id)
  const data = await fetchReplies(id).then(d => d.map(t => enrichTweet(t)))
  return data
}
