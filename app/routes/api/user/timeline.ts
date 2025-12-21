import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { getEnrichedUserTweet } from '~/lib/react-tweet'
import { getDBUser } from '~/lib/service/getUser.server'

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
