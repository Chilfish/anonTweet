import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { getDBUser } from '~/lib/getUser.server'
import { getEnrichedUserTweet } from '~/lib/react-tweet'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  const { username } = params

  const user = await getDBUser(username)

  if (!user?.id) {
    return []
  }

  return await getEnrichedUserTweet(user.id)
}
