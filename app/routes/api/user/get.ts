import type { Route } from './+types/get'
import type { RawUser } from '~/lib/react-tweet'
import { getDBUser } from '~/lib/service/getUser.server'

export async function loader({
  params,
}: Route.LoaderArgs): Promise<RawUser | null> {
  const { username } = params

  return await getDBUser(username)
}
