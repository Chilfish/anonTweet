import type { RawUser } from '~/types'
import { eq } from 'drizzle-orm'
import { getDbClient, isDbAvailable } from '~/lib/database/db.server'
import { tweetUser } from '~/lib/database/schema'
import { fetchUserDetails } from '~/lib/react-tweet/utils/get-tweet'

export async function getDBUser(username: string): Promise<RawUser | null> {
  // 1. 检查开关：如果没有 DB URL 或未开启缓存，直接走 API
  // 此时 db.server.ts 里的 neon() 根本不会被执行
  if (!isDbAvailable()) {
    return await fetchUserDetails(username)
  }

  // 2. 只有进入这里，才会真正初始化 DB 连接
  const db = getDbClient()

  try {
    const cachedUser = await db.query.tweetUser.findFirst({
      where: eq(tweetUser.tweetUserName, username),
    })

    const user = cachedUser?.user || await fetchUserDetails(username)

    if (!user)
      return null

    if (!cachedUser?.user) {
      await db.insert(tweetUser)
        .values({ tweetUserName: username, user })
        .onConflictDoUpdate({
          target: tweetUser.tweetUserName,
          set: { user },
        })
    }

    return user
  }
  catch (e) {
    console.error('DB Error (getUser), falling back to API:', e)
    return await fetchUserDetails(username)
  }
}
