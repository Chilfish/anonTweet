import type { Route } from './+types/get'
import type { TweetData } from '~/types'
import { isProduction } from '~/lib/env.server'
import { getEnrichedUserTweet } from '~/lib/react-tweet/utils/get-tweet'
import { getDBUser } from '~/lib/service/getUser.server'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData> {
  if (!isProduction) {
    return []
  }

  const { username } = params

  const user = await getDBUser(username)

  if (!user?.id) {
    return []
  }

  return await getEnrichedUserTweet(user.id)
}
