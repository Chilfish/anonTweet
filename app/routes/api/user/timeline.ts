import type { Route } from './+types/get'
import { data } from 'react-router'
import { getLocalCache } from '~/lib/localCache'
import { fetchUserDetails, getEnrichedUserTweet } from '~/lib/react-tweet/utils/get-tweet'

function getUserDetails(username: string) {
  return getLocalCache({
    id: username,
    type: 'user',
    getter: () => fetchUserDetails(username),
  })
}

function getUserTimeline(username: string) {
  return getLocalCache({
    id: username,
    type: 'timeline',
    getter: () => getEnrichedUserTweet(username),
  })
}

export async function loader({
  params,
}: Route.LoaderArgs) {
  const { username } = params

  try {
    const user = await getUserDetails(username)

    if (!user?.id) {
      return []
    }

    return await getUserTimeline(user.id)
  }
  catch (error: any) {
    console.error(`Error fetching user details for ${username}: ${error}`)
    return data({
      error: 'User not found',
      message: `无法获取用户信息，${error.message}`,
    }, {
      status: error.status || 500,
    })
  }
}
