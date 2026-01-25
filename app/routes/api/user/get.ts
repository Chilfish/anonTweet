import type { Route } from './+types/get'
import type { RawUser } from '~/types'
import { fetchUserDetails } from '~/lib/react-tweet/utils/get-tweet'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<RawUser | null> {
  const { username } = params

  return await fetchUserDetails(username)
}
