import type { Route } from './+types/get'
import type { RawUser } from '~/lib/react-tweet'
import { eq } from 'drizzle-orm'
import { db } from '~/lib/database/db.server'
import { tweetUser } from '~/lib/database/schema'
import { fetchUserDetails } from '~/lib/react-tweet'

export async function getDBUser(username: string): Promise<RawUser | null> {
  const cachedUser = await db.query.tweetUser.findFirst({
    where: eq(tweetUser.tweetUserName, username),
  })

  const user = cachedUser?.user || await fetchUserDetails(username)

  if (!user) {
    return null
  }

  if (!cachedUser?.user) {
    await db.insert(tweetUser)
      .values({
        tweetUserName: username,
        user,
      })
      .onConflictDoUpdate({
        target: tweetUser.tweetUserName,
        set: {
          user,
        },
      })
  }

  return user
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<RawUser | null> {
  const { username } = params

  return await getDBUser(username)
}
